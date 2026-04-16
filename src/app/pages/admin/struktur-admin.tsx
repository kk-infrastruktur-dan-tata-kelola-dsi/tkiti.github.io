import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ChevronRight, Pencil, Plus, Save, Trash2, Upload, User, UserPlus, X, ZoomIn } from 'lucide-react'
import {
  Background,
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  Handle,
  Position,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from '@dagrejs/dagre'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Badge } from '@/app/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/app/components/ui/alert-dialog'
import { apiRequest, toAbsoluteApiUrl } from '@/app/lib/api'

// ─── Types ───────────────────────────────────────────────────────────────────

type Anggota = {
  id: number
  nama: string
  role: string
  divisi: string | null
  parentId: number | null
  periodeId: number | null
  photo: string | null
  urutan: number | null
}

type TemplateNode = {
  id: number
  role: string
  parentMasterId?: number | null
  parentRole: string | null
  urutan: number
  divisi: string | null
  single: boolean
}

type Periode = {
  id: number
  nama: string
  mulai: string | null
  selesai: string | null
  isActive: boolean
}

type FormState = { nama: string; role: string }
const EMPTY_FORM: FormState = { nama: '', role: '' }

type PeriodeForm = { nama: string; mulai: string; selesai: string }
const EMPTY_PERIODE_FORM: PeriodeForm = { nama: '', mulai: '', selesai: '' }

// ─── Dagre auto-layout ──────────────────────────────────────────────────────

const NODE_WIDTH = 220
const NODE_HEIGHT = 80

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 40 })

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target)
  }

  dagre.layout(g)

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id)
    return {
      ...node,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
    }
  })

  return { nodes: layoutedNodes, edges }
}

// ─── Custom Node ─────────────────────────────────────────────────────────────

type MasterNodeData = {
  label: string
  divisi: string | null
  single: boolean
  templateId: number
  onEdit: (id: number) => void
  onDelete: (id: number) => void
}

function MasterCustomNode({ data }: NodeProps<Node<MasterNodeData>>) {
  const divisiColor: Record<string, string> = {
    kepemimpinan: 'bg-amber-100 text-amber-700 border-amber-200',
    anggota: 'bg-blue-100 text-blue-700 border-blue-200',
    kolaborasi: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  }
  const colorClass = data.divisi ? divisiColor[data.divisi] ?? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-gray-100 text-gray-600 border-gray-200'

  return (
    <div className="group relative rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm transition-shadow hover:shadow-md" style={{ width: NODE_WIDTH }}>
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-white !bg-blue-500" />

      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{data.label}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className={`inline-block rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${colorClass}`}>
              {data.divisi ?? 'umum'}
            </span>
            <span className="text-[10px] text-gray-400">
              {data.single ? '1 orang' : 'multi'}
            </span>
          </div>
        </div>
        <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            onClick={(e) => { e.stopPropagation(); data.onEdit(data.templateId) }}
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            type="button"
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
            onClick={(e) => { e.stopPropagation(); data.onDelete(data.templateId) }}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-white !bg-blue-500" />
    </div>
  )
}

const masterNodeTypes = { masterNode: MasterCustomNode }

// ─── Anggota Tree Node ───────────────────────────────────────────────────────

type AnggotaNodeData = {
  anggota: Anggota | null // null = empty slot
  role: string
  divisi: string | null
  single: boolean
  onEdit: (item: Anggota) => void
  onDelete: (id: number) => void
  onFillSlot: (role: string) => void
  photoUrl: string | null
}

function AnggotaCustomNode({ data }: NodeProps<Node<AnggotaNodeData>>) {
  const isEmpty = !data.anggota
  const divisiColor: Record<string, string> = {
    kepemimpinan: 'border-amber-300 bg-amber-50',
    anggota: 'border-blue-300 bg-blue-50',
    kolaborasi: 'border-emerald-300 bg-emerald-50',
  }
  const borderClass = data.divisi ? divisiColor[data.divisi] ?? 'border-gray-200 bg-white' : 'border-gray-200 bg-white'

  if (isEmpty) {
    return (
      <div className="group relative" style={{ width: 200 }}>
        <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-white !bg-gray-300" />
        <button
          type="button"
          onClick={() => data.onFillSlot(data.role)}
          className="flex w-full items-center gap-2.5 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-3 py-2.5 transition-colors hover:border-blue-400 hover:bg-blue-50"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-gray-300">
            <UserPlus className="h-4 w-4 text-gray-400" />
          </div>
          <div className="min-w-0 text-left">
            <p className="truncate text-[10px] font-medium uppercase text-gray-400">{data.role}</p>
            <p className="text-xs text-gray-400">Klik untuk isi</p>
          </div>
        </button>
        <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-white !bg-gray-300" />
      </div>
    )
  }

  const item = data.anggota!
  const initials = item.nama
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className={`group relative rounded-lg border-2 px-3 py-2.5 shadow-sm transition-shadow hover:shadow-md ${borderClass}`} style={{ width: 200 }}>
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-white !bg-blue-500" />

      <div className="flex items-center gap-2.5">
        {data.photoUrl ? (
          <img src={data.photoUrl} alt={item.nama} className="h-9 w-9 rounded-full border border-gray-200 object-cover" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-xs font-bold text-blue-600">
            {initials || '?'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-medium uppercase text-gray-400">{item.role}</p>
          <p className="truncate text-sm font-semibold text-gray-900">{item.nama}</p>
        </div>
      </div>

      {/* Hover actions */}
      <div className="absolute -right-1 -top-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          className="rounded-full bg-white p-1 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
          onClick={(e) => { e.stopPropagation(); data.onEdit(item) }}
        >
          <Pencil className="h-3 w-3 text-gray-500" />
        </button>
        <button
          type="button"
          className="rounded-full bg-white p-1 shadow-sm ring-1 ring-gray-200 hover:bg-red-50"
          onClick={(e) => { e.stopPropagation(); data.onDelete(item.id) }}
        >
          <Trash2 className="h-3 w-3 text-red-400" />
        </button>
      </div>

      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-white !bg-blue-500" />
    </div>
  )
}

const anggotaNodeTypes = { anggotaNode: AnggotaCustomNode }

// ─── Anggota Tree Canvas ─────────────────────────────────────────────────────

const ANGGOTA_NODE_W = 200
const ANGGOTA_NODE_H = 70

function AnggotaTreeCanvas({
  items,
  template,
  onEdit,
  onDelete,
  onFillSlot,
}: {
  items: Anggota[]
  template: TemplateNode[]
  onEdit: (item: Anggota) => void
  onDelete: (id: number) => void
  onFillSlot: (role: string) => void
}) {
  const { fitView } = useReactFlow()

  // Build nodes: one per master role slot. For multi roles, show filled + one empty.
  const { treeNodes, treeEdges } = useMemo(() => {
    const nodes: Node<AnggotaNodeData>[] = []
    const edges: Edge[] = []
    let emptyCounter = 0

    for (const master of template) {
      const members = items.filter((m) => m.role === master.role)
      const parentMaster = master.parentMasterId ? template.find((t) => t.id === master.parentMasterId) : null

      if (members.length === 0) {
        // Empty slot
        const nodeId = `empty-${master.id}-${emptyCounter++}`
        nodes.push({
          id: nodeId,
          type: 'anggotaNode',
          data: {
            anggota: null,
            role: master.role,
            divisi: master.divisi,
            single: master.single,
            onEdit,
            onDelete,
            onFillSlot,
            photoUrl: null,
          },
          position: { x: 0, y: 0 },
        })
        // Edge from parent member or parent empty slot
        if (parentMaster) {
          const parentMembers = items.filter((m) => m.role === parentMaster.role)
          const parentNodeId = parentMembers.length > 0 ? `member-${parentMembers[0].id}` : `empty-${parentMaster.id}-0`
          // Find actual parent node id (may have different empty counter)
          const existingParent = nodes.find((n) => n.id === parentNodeId || (n.id.startsWith(`empty-${parentMaster.id}-`) && !n.data.anggota))
          if (existingParent) {
            edges.push({ id: `e-${existingParent.id}-${nodeId}`, source: existingParent.id, target: nodeId, type: 'smoothstep', style: { stroke: '#d1d5db', strokeWidth: 1.5, strokeDasharray: '4 4' } })
          }
        }
      } else {
        for (const member of members) {
          const nodeId = `member-${member.id}`
          nodes.push({
            id: nodeId,
            type: 'anggotaNode',
            data: {
              anggota: member,
              role: master.role,
              divisi: master.divisi,
              single: master.single,
              onEdit,
              onDelete,
              onFillSlot,
              photoUrl: toAbsoluteApiUrl(member.photo),
            },
            position: { x: 0, y: 0 },
          })
          // Edge from parent
          if (member.parentId) {
            const parentNodeId = `member-${member.parentId}`
            if (nodes.find((n) => n.id === parentNodeId)) {
              edges.push({ id: `e-${parentNodeId}-${nodeId}`, source: parentNodeId, target: nodeId, type: 'smoothstep', style: { stroke: '#94a3b8', strokeWidth: 2 } })
            }
          } else if (parentMaster) {
            // Connect to first parent member
            const parentMembers = items.filter((m) => m.role === parentMaster.role)
            if (parentMembers.length > 0) {
              const pId = `member-${parentMembers[0].id}`
              if (nodes.find((n) => n.id === pId)) {
                edges.push({ id: `e-${pId}-${nodeId}`, source: pId, target: nodeId, type: 'smoothstep', style: { stroke: '#94a3b8', strokeWidth: 2 } })
              }
            }
          }
        }

        // Add empty slot for multi roles
        if (!master.single) {
          const emptyId = `empty-${master.id}-${emptyCounter++}`
          nodes.push({
            id: emptyId,
            type: 'anggotaNode',
            data: {
              anggota: null,
              role: master.role,
              divisi: master.divisi,
              single: master.single,
              onEdit,
              onDelete,
              onFillSlot,
              photoUrl: null,
            },
            position: { x: 0, y: 0 },
          })
          // Connect to parent
          if (parentMaster) {
            const parentMembers = items.filter((m) => m.role === parentMaster.role)
            if (parentMembers.length > 0) {
              edges.push({ id: `e-member-${parentMembers[0].id}-${emptyId}`, source: `member-${parentMembers[0].id}`, target: emptyId, type: 'smoothstep', style: { stroke: '#d1d5db', strokeWidth: 1.5, strokeDasharray: '4 4' } })
            }
          }
        }
      }
    }

    return { treeNodes: nodes, treeEdges: edges }
  }, [items, template, onEdit, onDelete, onFillSlot])

  // Auto-layout with dagre
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    const g = new dagre.graphlib.Graph()
    g.setDefaultEdgeLabel(() => ({}))
    g.setGraph({ rankdir: 'TB', ranksep: 70, nodesep: 30 })
    for (const node of treeNodes) g.setNode(node.id, { width: ANGGOTA_NODE_W, height: ANGGOTA_NODE_H })
    for (const edge of treeEdges) {
      const targetNode = treeNodes.find(n => n.id === edge.target)
      const isKoord = targetNode?.data?.role?.toLowerCase().includes('koordinator asisten')
      const targetMinLen = isKoord ? 2 : 1
      g.setEdge(edge.source, edge.target, { minlen: targetMinLen })
    }
    dagre.layout(g)
    return {
      nodes: treeNodes.map((node) => {
        const pos = g.node(node.id)
        return { ...node, position: pos ? { x: pos.x - ANGGOTA_NODE_W / 2, y: pos.y - ANGGOTA_NODE_H / 2 } : { x: 0, y: 0 } }
      }),
      edges: treeEdges,
    }
  }, [treeNodes, treeEdges])

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges)

  useEffect(() => {
    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
    setTimeout(() => fitView({ padding: 0.15 }), 50)
  }, [layoutedNodes, layoutedEdges])

  return (
    <div className="relative h-[500px] w-full rounded-lg border border-gray-200 bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={anggotaNodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: true }}
        className="rounded-lg"
        nodesDraggable={false}
        nodesConnectable={false}
        deleteKeyCode={null}
      >
        <Background gap={16} size={1} color="#e5e7eb" />
        <Controls showInteractive={false} />
      </ReactFlow>

      {/* Floating toolbar */}
      <div className="absolute left-3 top-3 z-10 flex gap-1.5">
        <button
          type="button"
          onClick={() => fitView({ padding: 0.15 })}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <ZoomIn className="h-3.5 w-3.5" /> Fit
        </button>
      </div>

      {/* Info */}
      <div className="absolute bottom-3 left-3 z-10 flex gap-2 rounded-lg border border-gray-200 bg-white/90 px-3 py-1.5 text-[10px] backdrop-blur-sm">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> Kepemimpinan
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-400" /> Anggota
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400" /> Kolaborasi
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded border border-dashed border-gray-400" /> Slot kosong
        </span>
      </div>
    </div>
  )
}

// ─── Canvas Editor ───────────────────────────────────────────────────────────

function MasterCanvasEditor({
  template,
  onConnect,
  onEdit,
  onDelete,
  onAdd,
}: {
  template: TemplateNode[]
  onConnect: (sourceId: number, targetId: number) => void
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  onAdd: () => void
}) {
  const { fitView } = useReactFlow()

  const initialNodes: Node<MasterNodeData>[] = useMemo(
    () =>
      template.map((node) => ({
        id: String(node.id),
        type: 'masterNode',
        data: {
          label: node.role,
          divisi: node.divisi,
          single: node.single,
          templateId: node.id,
          onEdit,
          onDelete,
        },
        position: { x: 0, y: 0 },
      })),
    [template, onEdit, onDelete],
  )

  const initialEdges: Edge[] = useMemo(
    () =>
      template
        .filter((node) => node.parentMasterId)
        .map((node) => ({
          id: `e-${node.parentMasterId}-${node.id}`,
          source: String(node.parentMasterId),
          target: String(node.id),
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#94a3b8', strokeWidth: 2 },
        })),
    [template],
  )

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(initialNodes, initialEdges),
    [initialNodes, initialEdges],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges)

  useEffect(() => {
    const { nodes: ln, edges: le } = getLayoutedElements(initialNodes, initialEdges)
    setNodes(ln)
    setEdges(le)
    setTimeout(() => fitView({ padding: 0.2 }), 50)
  }, [template])

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      const sourceId = Number(connection.source)
      const targetId = Number(connection.target)
      if (sourceId === targetId) return
      onConnect(sourceId, targetId)
    },
    [onConnect],
  )

  return (
    <div className="relative h-[450px] w-full rounded-lg border border-gray-200 bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        nodeTypes={masterNodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        className="rounded-lg"
        deleteKeyCode={null}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: '#94a3b8', strokeWidth: 2 },
        }}
      >
        <Background gap={16} size={1} color="#e5e7eb" />
        <Controls showInteractive={false} />
      </ReactFlow>

      {/* Floating toolbar */}
      <div className="absolute left-3 top-3 z-10 flex gap-1.5">
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <Plus className="h-3.5 w-3.5" /> Tambah Role
        </button>
        <button
          type="button"
          onClick={() => fitView({ padding: 0.2 })}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <ZoomIn className="h-3.5 w-3.5" /> Fit
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 flex gap-2 rounded-lg border border-gray-200 bg-white/90 px-3 py-1.5 text-[10px] backdrop-blur-sm">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> Kepemimpinan
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-400" /> Anggota
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400" /> Kolaborasi
        </span>
        <span className="text-gray-400">Drag handle ● → ● untuk set parent</span>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function AdminStruktur() {
  const [items, setItems] = useState<Anggota[]>([])
  const [template, setTemplate] = useState<TemplateNode[]>([])
  const [periodes, setPeriodes] = useState<Periode[]>([])
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodeDialogOpen, setPeriodeDialogOpen] = useState(false)
  const [masterDialogOpen, setMasterDialogOpen] = useState(false)
  const [editingPeriodeId, setEditingPeriodeId] = useState<number | null>(null)
  const [editingMasterId, setEditingMasterId] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [periodeForm, setPeriodeForm] = useState<PeriodeForm>(EMPTY_PERIODE_FORM)
  const [masterRole, setMasterRole] = useState('')
  const [masterSingle, setMasterSingle] = useState(false)
  const [masterDivisi, setMasterDivisi] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [creatingPeriode, setCreatingPeriode] = useState(false)
  const [savingMaster, setSavingMaster] = useState(false)
  const [deletingPeriodeId, setDeletingPeriodeId] = useState<number | null>(null)
  const [activatingPeriodeId, setActivatingPeriodeId] = useState<number | null>(null)
  const [resetting, setResetting] = useState(false)
  const [confirmDeleteMasterId, setConfirmDeleteMasterId] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const activePeriode = useMemo(() => periodes.find((p) => p.isActive) ?? null, [periodes])
  const effectivePeriodeId = selectedPeriodeId ?? activePeriode?.id ?? null
  const roleOptions = useMemo(() => template.map((node) => node.role), [template])

  // ─── Data fetching ─────────────────────────────────────────────────────────

  async function fetchData(targetPeriodeId?: number | null) {
    const [resPeriode, resTemplate] = await Promise.all([
      apiRequest<Periode[]>('/struktur/periode'),
      apiRequest<TemplateNode[]>('/struktur/template'),
    ])

    let periodeList: Periode[] = []
    if (resPeriode.success && resPeriode.data) {
      periodeList = resPeriode.data
      setPeriodes(periodeList)
    }
    if (resTemplate.success && resTemplate.data) setTemplate(resTemplate.data)

    const active = periodeList.find((p) => p.isActive) ?? null
    const finalPeriodeId = targetPeriodeId ?? selectedPeriodeId ?? active?.id ?? null
    if (finalPeriodeId !== null) {
      const resItems = await apiRequest<Anggota[]>(`/struktur?periodeId=${finalPeriodeId}`)
      if (resItems.success && resItems.data) setItems(resItems.data)
      setSelectedPeriodeId(finalPeriodeId)
    } else {
      setItems([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData(null)
  }, [])

  // ─── Periode handlers ──────────────────────────────────────────────────────

  async function changePeriode(id: number) {
    setSelectedPeriodeId(id)
    const resItems = await apiRequest<Anggota[]>(`/struktur?periodeId=${id}`)
    if (resItems.success && resItems.data) setItems(resItems.data)
  }

  async function submitPeriode(e?: React.MouseEvent) {
    if (e) e.preventDefault()
    if (!periodeForm.nama.trim()) {
      toast.error('Nama periode wajib diisi')
      return
    }
    setCreatingPeriode(true)
    const res = await apiRequest<Periode>(editingPeriodeId ? `/struktur/periode/${editingPeriodeId}` : '/struktur/periode', {
      method: editingPeriodeId ? 'PUT' : 'POST',
      body: JSON.stringify({
        nama: periodeForm.nama.trim(),
        mulai: periodeForm.mulai || null,
        selesai: periodeForm.selesai || null,
      }),
    })
    if (res.success && res.data) {
      toast.success(editingPeriodeId ? 'Periode berhasil diperbarui' : 'Periode berhasil dibuat')
      setPeriodeDialogOpen(false)
      setEditingPeriodeId(null)
      setPeriodeForm(EMPTY_PERIODE_FORM)
      await fetchData(res.data.id)
    } else {
      toast.error(res.error ?? 'Gagal menyimpan periode')
    }
    setCreatingPeriode(false)
  }

  function openCreatePeriode() {
    setEditingPeriodeId(null)
    setPeriodeForm(EMPTY_PERIODE_FORM)
    setPeriodeDialogOpen(true)
  }

  function openEditPeriode(periode: Periode) {
    setEditingPeriodeId(periode.id)
    setPeriodeForm({
      nama: periode.nama,
      mulai: periode.mulai ?? '',
      selesai: periode.selesai ?? '',
    })
    setPeriodeDialogOpen(true)
  }

  async function deletePeriode(id: number) {
    setDeletingPeriodeId(id)
    const res = await apiRequest(`/struktur/periode/${id}`, { method: 'DELETE' })
    if (res.success) {
      toast.success('Periode berhasil dihapus')
      if (selectedPeriodeId === id) setSelectedPeriodeId(null)
      await fetchData(null)
    } else {
      toast.error(res.error ?? 'Gagal menghapus periode')
    }
    setDeletingPeriodeId(null)
  }

  async function activatePeriode(id: number) {
    setActivatingPeriodeId(id)
    const res = await apiRequest(`/struktur/periode/${id}/activate`, { method: 'PUT' })
    if (res.success) {
      toast.success('Periode aktif berhasil diubah')
      await fetchData(id)
    } else {
      toast.error(res.error ?? 'Gagal mengaktifkan periode')
    }
    setActivatingPeriodeId(null)
  }

  // ─── Master canvas handlers ────────────────────────────────────────────────

  const handleCanvasConnect = useCallback(
    async (sourceId: number, targetId: number) => {
      const target = template.find((n) => n.id === targetId)
      if (!target) return
      const res = await apiRequest(`/struktur/master/${targetId}`, {
        method: 'PUT',
        body: JSON.stringify({
          role: target.role,
          parentMasterId: sourceId,
          urutan: target.urutan,
          divisi: target.divisi,
          single: target.single,
        }),
      })
      if (res.success) {
        toast.success(`"${target.role}" sekarang dibawah parent baru`)
        // Auto-reorder after connection change
        await apiRequest('/struktur/master/reorder', { method: 'POST' })
        await fetchData(effectivePeriodeId)
      } else {
        toast.error(res.error ?? 'Gagal mengubah parent')
      }
    },
    [template, effectivePeriodeId],
  )

  const handleCanvasEdit = useCallback(
    (id: number) => {
      const node = template.find((n) => n.id === id)
      if (!node) return
      setEditingMasterId(id)
      setMasterRole(node.role)
      setMasterSingle(node.single)
      setMasterDivisi(node.divisi ?? '')
      setMasterDialogOpen(true)
    },
    [template],
  )

  const handleCanvasDelete = useCallback((id: number) => {
    setConfirmDeleteMasterId(id)
  }, [])

  const handleCanvasAdd = useCallback(() => {
    setEditingMasterId(null)
    setMasterRole('')
    setMasterSingle(false)
    setMasterDivisi('')
    setMasterDialogOpen(true)
  }, [])

  async function submitMaster(e?: React.MouseEvent) {
    if (e) e.preventDefault()
    if (!masterRole.trim()) {
      toast.error('Role master wajib diisi')
      return
    }
    setSavingMaster(true)

    if (editingMasterId) {
      // Update existing
      const node = template.find((n) => n.id === editingMasterId)
      const res = await apiRequest(`/struktur/master/${editingMasterId}`, {
        method: 'PUT',
        body: JSON.stringify({
          role: masterRole.trim(),
          parentMasterId: node?.parentMasterId ?? null,
          urutan: node?.urutan ?? 1,
          divisi: masterDivisi || null,
          single: masterSingle,
        }),
      })
      if (res.success) {
        toast.success('Role master diperbarui')
        setMasterDialogOpen(false)
        await fetchData(effectivePeriodeId)
      } else {
        toast.error(res.error ?? 'Gagal menyimpan')
      }
    } else {
      // Create new — auto-assign urutan
      const res = await apiRequest('/struktur/master', {
        method: 'POST',
        body: JSON.stringify({
          role: masterRole.trim(),
          parentMasterId: null,
          urutan: template.length + 1,
          divisi: masterDivisi || null,
          single: masterSingle,
        }),
      })
      if (res.success) {
        toast.success('Role master ditambahkan — drag handle untuk set parent')
        setMasterDialogOpen(false)
        await fetchData(effectivePeriodeId)
      } else {
        toast.error(res.error ?? 'Gagal menyimpan')
      }
    }
    setSavingMaster(false)
  }

  async function confirmDeleteMaster() {
    if (!confirmDeleteMasterId) return
    const res = await apiRequest(`/struktur/master/${confirmDeleteMasterId}`, { method: 'DELETE' })
    if (res.success) {
      toast.success('Role master dihapus')
      await fetchData(effectivePeriodeId)
    } else {
      toast.error(res.error ?? 'Gagal menghapus')
    }
    setConfirmDeleteMasterId(null)
  }

  // ─── Anggota sidebar handlers ───────────────────────────────────────────────

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [confirmDeleteAnggotaId, setConfirmDeleteAnggotaId] = useState<number | null>(null)

  function openSidebar(role: string, item?: Anggota) {
    setEditId(item?.id ?? null)
    setForm({ nama: item?.nama ?? '', role })
    setPhotoFile(null)
    setPhotoPreview(item ? (toAbsoluteApiUrl(item.photo) ?? '') : '')
    setSidebarOpen(true)
  }

  function closeSidebar() {
    setSidebarOpen(false)
    setEditId(null)
    setForm(EMPTY_FORM)
    setPhotoFile(null)
    setPhotoPreview('')
  }

  const handleFillSlot = useCallback(
    (role: string) => {
      if (!effectivePeriodeId) {
        toast.error('Buat periode terlebih dahulu')
        return
      }
      openSidebar(role)
    },
    [effectivePeriodeId],
  )

  const handleAnggotaEdit = useCallback(
    (item: Anggota) => {
      openSidebar(item.role, item)
    },
    [],
  )

  const handleAnggotaDeleteRequest = useCallback((id: number) => {
    setConfirmDeleteAnggotaId(id)
  }, [])

  function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSave(e?: React.MouseEvent) {
    if (e) e.preventDefault()
    if (!effectivePeriodeId) {
      toast.error('Periode tidak valid')
      return
    }
    if (!form.nama.trim() || !form.role.trim()) {
      toast.error('Nama dan role wajib diisi')
      return
    }
    if (!roleOptions.includes(form.role.trim())) {
      toast.error('Role harus dipilih dari template struktur')
      return
    }

    setSaving(true)
    const fd = new FormData()
    fd.append('nama', form.nama.trim())
    fd.append('role', form.role.trim())
    fd.append('periodeId', String(effectivePeriodeId))
    if (photoFile) fd.append('photo', photoFile)

    const url = editId ? `/struktur/${editId}` : '/struktur'
    const method = editId ? 'PUT' : 'POST'
    const res = await apiRequest<Anggota>(url, { method, body: fd })

    if (res.success) {
      toast.success(editId ? 'Anggota diperbarui' : 'Anggota ditambahkan')
      closeSidebar()
      await fetchData(effectivePeriodeId)
    } else {
      toast.error(res.error ?? 'Gagal menyimpan')
    }
    setSaving(false)
  }

  async function handleDelete(id: number) {
    const hasChildren = items.some((item) => item.parentId === id)
    if (hasChildren) {
      toast.error('Tidak bisa hapus node yang masih punya anak')
      return
    }
    const res = await apiRequest(`/struktur/${id}`, { method: 'DELETE' })
    if (res.success) {
      toast.success('Anggota dihapus')
      closeSidebar()
      setItems((prev) => prev.filter((item) => item.id !== id))
    } else {
      toast.error(res.error ?? 'Gagal menghapus')
    }
  }

  async function handleResetPeriode() {
    if (!effectivePeriodeId) return
    setResetting(true)
    const res = await apiRequest('/struktur/reset', {
      method: 'POST',
      body: JSON.stringify({ periodeId: effectivePeriodeId }),
    })
    if (res.success) {
      toast.success('Data struktur periode berhasil dihapus')
      await fetchData(effectivePeriodeId)
    } else {
      toast.error(res.error ?? 'Gagal reset struktur periode')
    }
    setResetting(false)
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Struktur Organisasi</h1>
          <p className="mt-0.5 text-sm text-gray-500">Kelola template role dan anggota per periode via canvas.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={openCreatePeriode}>
            + Buat Periode
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-red-600" disabled={resetting || !effectivePeriodeId}>
                {resetting ? 'Resetting...' : 'Reset Anggota Periode Ini'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus semua anggota untuk periode ini?</AlertDialogTitle>
                <AlertDialogDescription>Data anggota pada periode terpilih akan dihapus. Template role master tetap ada.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={handleResetPeriode}>
                  Hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Periode list */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Daftar Periode</h2>
        <div className="space-y-2">
          {periodes.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada periode.</p>
          ) : (
            periodes.map((periode) => (
              <div key={periode.id} className="flex items-center justify-between rounded border border-gray-100 px-3 py-2">
                <button type="button" className="text-left" onClick={() => changePeriode(periode.id)}>
                  <p className="text-sm font-semibold text-gray-900">{periode.nama}</p>
                  <p className="text-xs text-gray-500">
                    {periode.mulai ?? '-'} s/d {periode.selesai ?? '-'}
                  </p>
                </button>
                <div className="flex items-center gap-2">
                  {periode.isActive ? <Badge>Aktif</Badge> : <Badge variant="secondary">Arsip</Badge>}
                  <Button size="sm" variant="outline" onClick={() => openEditPeriode(periode)}>
                    Edit
                  </Button>
                  {!periode.isActive && (
                    <Button size="sm" variant="outline" disabled={activatingPeriodeId === periode.id} onClick={() => activatePeriode(periode.id)}>
                      {activatingPeriodeId === periode.id ? 'Mengaktifkan...' : 'Jadikan Aktif'}
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-red-600" disabled={deletingPeriodeId === periode.id}>
                        {deletingPeriodeId === periode.id ? 'Menghapus...' : 'Hapus'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus periode ini?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Semua data struktur pada periode "{periode.nama}" akan ikut terhapus.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => deletePeriode(periode.id)}>
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Master Structure Canvas */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Struktur Master — Canvas Editor</h2>
          <p className="text-xs text-gray-400">Drag dari titik biru bawah node → titik biru atas node lain untuk set parent. Hover node untuk edit/hapus.</p>
        </div>
        <ReactFlowProvider>
          <MasterCanvasEditor
            template={template}
            onConnect={handleCanvasConnect}
            onEdit={handleCanvasEdit}
            onDelete={handleCanvasDelete}
            onAdd={handleCanvasAdd}
          />
        </ReactFlowProvider>
      </div>

      {/* Anggota Tree Canvas + Sidebar */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Anggota Periode: {periodes.find((p) => p.id === effectivePeriodeId)?.nama ?? '-'} ({items.length})
          </h2>
          <p className="text-xs text-gray-400">Klik slot kosong untuk tambah anggota. Hover node untuk edit/hapus.</p>
        </div>
        {loading ? (
          <p className="py-6 text-center text-sm text-gray-400">Memuat data...</p>
        ) : template.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">Buat template master terlebih dahulu.</p>
        ) : (
          <div className="flex gap-4">
            {/* Canvas */}
            <div className={sidebarOpen ? 'flex-1 min-w-0' : 'w-full'}>
              <ReactFlowProvider>
                <AnggotaTreeCanvas
                  items={items}
                  template={template}
                  onEdit={handleAnggotaEdit}
                  onDelete={handleAnggotaDeleteRequest}
                  onFillSlot={handleFillSlot}
                />
              </ReactFlowProvider>
            </div>

            {/* Sidebar Panel */}
            {sidebarOpen && (
              <div className="w-72 shrink-0 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800">
                    {editId ? 'Edit Anggota' : 'Tambah Anggota'}
                  </h3>
                  <button type="button" onClick={closeSidebar} className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Photo */}
                  <div className="flex flex-col items-center gap-2">
                    {photoPreview ? (
                      <img src={photoPreview} alt="" className="h-20 w-20 rounded-full border-2 border-gray-200 object-cover" />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200">
                        <User className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => fileRef.current?.click()}>
                      <Upload className="h-3 w-3" /> Upload foto
                    </Button>
                  </div>

                  {/* Role (read-only indicator) */}
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Role</Label>
                    <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                      <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                      <span className="truncate">{form.role}</span>
                    </div>
                  </div>

                  {/* Nama */}
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Nama</Label>
                    <Input
                      value={form.nama}
                      onChange={(e: any) => setForm((prev) => ({ ...prev, nama: e.target.value }))}
                      placeholder="Masukkan nama"
                      autoFocus
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-2">
                    <Button onClick={handleSave} disabled={saving} className="gap-1.5">
                      <Save className="h-3.5 w-3.5" />
                      {saving ? 'Menyimpan...' : editId ? 'Simpan' : 'Tambah'}
                    </Button>
                    {editId && (
                      <Button
                        variant="outline"
                        className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setConfirmDeleteAnggotaId(editId)}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Hapus anggota ini
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Dialogs ──────────────────────────────────────────────────────────── */}

      {/* Periode dialog */}
      <Dialog open={periodeDialogOpen} onOpenChange={setPeriodeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPeriodeId ? 'Edit Periode Kepengurusan' : 'Buat Periode Kepengurusan'}</DialogTitle>
            <DialogDescription>Contoh nama: Periode 2024/2025</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Nama Periode</Label>
              <Input value={periodeForm.nama} onChange={(e: any) => setPeriodeForm((prev) => ({ ...prev, nama: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Mulai</Label>
                <Input type="date" value={periodeForm.mulai} onChange={(e: any) => setPeriodeForm((prev) => ({ ...prev, mulai: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Selesai</Label>
                <Input type="date" value={periodeForm.selesai} onChange={(e: any) => setPeriodeForm((prev) => ({ ...prev, selesai: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPeriodeDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={submitPeriode} disabled={creatingPeriode}>
              {creatingPeriode ? 'Menyimpan...' : editingPeriodeId ? 'Update' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Master role dialog — simplified (no urutan/parent input) */}
      <Dialog open={masterDialogOpen} onOpenChange={setMasterDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMasterId ? 'Edit Role Master' : 'Tambah Role Master'}</DialogTitle>
            <DialogDescription>
              {editingMasterId
                ? 'Edit nama dan properties. Parent diatur via canvas (drag handle).'
                : 'Buat role baru. Setelah dibuat, drag handle di canvas untuk set parent.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Nama Role</Label>
              <Input
                value={masterRole}
                onChange={(e: any) => setMasterRole(e.target.value)}
                placeholder="Contoh: Koordinator Divisi"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Divisi</Label>
              <select
                value={masterDivisi}
                onChange={(e) => setMasterDivisi(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
              >
                <option value="">Umum</option>
                <option value="kepemimpinan">Kepemimpinan</option>
                <option value="anggota">Anggota</option>
                <option value="kolaborasi">Kolaborasi</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={masterSingle}
                onChange={(e) => setMasterSingle(e.target.checked)}
              />
              Role tunggal (hanya 1 orang per periode)
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMasterDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={submitMaster} disabled={savingMaster}>
              {savingMaster ? 'Menyimpan...' : editingMasterId ? 'Update' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete master confirmation */}
      <AlertDialog open={confirmDeleteMasterId !== null} onOpenChange={(open: boolean) => { if (!open) setConfirmDeleteMasterId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus role master?</AlertDialogTitle>
            <AlertDialogDescription>
              Role "{template.find((n) => n.id === confirmDeleteMasterId)?.role}" akan dihapus jika tidak dipakai dan tidak punya child.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDeleteMaster}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete anggota confirmation */}
      <AlertDialog open={confirmDeleteAnggotaId !== null} onOpenChange={(open: boolean) => { if (!open) setConfirmDeleteAnggotaId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus anggota?</AlertDialogTitle>
            <AlertDialogDescription>
              {items.find((i) => i.id === confirmDeleteAnggotaId)?.nama ?? 'Anggota'} akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={async () => {
                if (confirmDeleteAnggotaId) await handleDelete(confirmDeleteAnggotaId)
                setConfirmDeleteAnggotaId(null)
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
