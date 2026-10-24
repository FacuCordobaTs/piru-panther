import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { contextoParaResolverMarketing, guardarContextoTracking } from '@/lib/tracking'

const API_URL = (import.meta.env.VITE_API_URL || 'https://api.piru.app/api').replace(/\/$/, '')
const USERNAME = 'pantherburger'
type Destino = { tipo: 'tienda' } | { tipo: 'producto'; productoId: number } | { tipo: 'carrito'; carritoRep: string }
type Respuesta = { data?: { encontrada?: boolean; destino?: Destino; contexto?: { campaniaSlug?: string } } }

function Resolver({ tipo }: { tipo: 'campana' | 'receta' }) {
  const navigate = useNavigate(), { slug, token } = useParams()
  useEffect(() => {
    if ((tipo === 'campana' && !slug) || (tipo === 'receta' && !token)) return
    const abort = new AbortController()
    void (async () => {
      const value = tipo === 'campana' ? slug! : token!, endpoint = tipo === 'campana' ? 'campanas' : 'recetas'
      let response: Respuesta | null = null
      try { const result = await fetch(`${API_URL}/public/marketing/${endpoint}/${USERNAME}/${encodeURIComponent(value)}?${new URLSearchParams(contextoParaResolverMarketing(USERNAME))}`, { signal: abort.signal }); if (result.ok) response = await result.json() } catch { /* tienda as fallback */ }
      if (tipo === 'campana' && response?.data?.encontrada && response.data.contexto?.campaniaSlug) guardarContextoTracking({ username: USERNAME, campaniaSlug: response.data.contexto.campaniaSlug })
      if (tipo === 'receta' && response?.data?.encontrada) guardarContextoTracking({ username: USERNAME, recetaToken: token! })
      const destino = response?.data?.destino
      navigate(destino?.tipo === 'producto' ? `/?producto=${destino.productoId}` : destino?.tipo === 'carrito' ? `/?rep=${encodeURIComponent(destino.carritoRep)}` : '/', { replace: true })
    })()
    return () => abort.abort()
  }, [navigate, slug, token, tipo])
  return null
}

export const CampanaLinkResolver = () => <Resolver tipo="campana" />
export const RecetaLinkResolver = () => <Resolver tipo="receta" />
