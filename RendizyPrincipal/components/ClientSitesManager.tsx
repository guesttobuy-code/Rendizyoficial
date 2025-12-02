import { useState, useEffect, useCallback } from 'react';
import { Plus, Globe, Code, Settings, Eye, Trash2, Upload, ExternalLink, Copy, Check, FileText, Sparkles, Download, Folder, File, AlertCircle, Edit } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

// ============================================================
// TIPOS
// ============================================================

interface ClientSite {
  organizationId: string;
  siteName: string;
  template: 'custom' | 'moderno' | 'classico' | 'luxo';
  domain?: string;
  subdomain: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
  logo?: string;
  favicon?: string;
  siteConfig: {
    title: string;
    description: string;
    slogan?: string;
    contactEmail: string;
    contactPhone: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      whatsapp?: string;
    };
  };
  features: {
    shortTerm: boolean;
    longTerm: boolean;
    sale: boolean;
  };
  siteCode?: string;
  archivePath?: string; // Caminho do arquivo no Storage
  archiveUrl?: string; // URL assinada do arquivo
  extractedBaseUrl?: string; // ✅ NOVO: Base URL pública do Storage para arquivos extraídos
  extractedFilesCount?: number; // ✅ NOVO: Quantidade de arquivos extraídos do ZIP
  source?: 'bolt' | 'v0' | 'figma' | 'custom'; // Fonte do site
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export function ClientSitesManager() {
  console.log('🔍 [ClientSitesManager] Componente renderizado/montado');
  
  const [sites, setSites] = useState<ClientSite[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState<ClientSite | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Funções memoizadas para evitar loops infinitos
  const loadOrganizations = useCallback(async () => {
    try {
      setLoadingOrgs(true);
      const url = `https://${projectId}.supabase.co/functions/v1/rendizy-server/make-server-67caf26a/organizations`;
      
      console.log('🔍 [ClientSitesManager] Carregando organizações...');
      console.log('📍 [ClientSitesManager] URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 [ClientSitesManager] Status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [ClientSitesManager] Erro HTTP:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('📦 [ClientSitesManager] Dados recebidos (COMPLETO):', JSON.stringify(data, null, 2));
      console.log('📦 [ClientSitesManager] data.success:', data.success);
      console.log('📦 [ClientSitesManager] data.data:', data.data);
      console.log('📦 [ClientSitesManager] data.data type:', typeof data.data);
      console.log('📦 [ClientSitesManager] data.data is array?', Array.isArray(data.data));
      console.log('📦 [ClientSitesManager] Total de organizações:', data.data?.length || 0);
      console.log('📦 [ClientSitesManager] data.total:', data.total);
      
      if (data.success && data.data) {
        console.log('✅ [ClientSitesManager] Organizações encontradas:', data.data.length);
        // Log de cada organização
        data.data.forEach((org: any, index: number) => {
          console.log(`  ${index + 1}. ${org.name} (ID: ${org.id}, Slug: ${org.slug})`);
        });
        setOrganizations(data.data);
        toast.success(`${data.data.length} imobiliárias carregadas`);
      } else {
        console.error('❌ [ClientSitesManager] Resposta sem sucesso:', data);
        console.error('❌ [ClientSitesManager] Erro:', data.error);
        toast.error(data.error || 'Erro ao carregar imobiliárias');
        setOrganizations([]);
      }
    } catch (error: any) {
      console.error('❌ [ClientSitesManager] Erro completo:', error);
      toast.error(`Erro ao carregar imobiliárias: ${error.message}`);
      setOrganizations([]);
    } finally {
      setLoadingOrgs(false);
    }
  }, []);

  const loadSites = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 [ClientSitesManager] Carregando sites...');
      console.log('🔍 [ClientSitesManager] selectedOrgId:', selectedOrgId);
      
      // ✅ CORRIGIDO: Passar organizationId como query param quando houver uma organização selecionada
      // Isso garante que o backend busque o site correto mesmo se o organizationId do token for diferente
      const url = selectedOrgId && selectedOrgId !== 'all'
        ? `https://${projectId}.supabase.co/functions/v1/rendizy-server/make-server-67caf26a/client-sites?organization_id=${selectedOrgId}`
        : `https://${projectId}.supabase.co/functions/v1/rendizy-server/make-server-67caf26a/client-sites`;
      
      console.log('📍 [ClientSitesManager] URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 [ClientSitesManager] Status:', response.status, response.statusText);

      const data = await response.json();
      console.log('📦 [ClientSitesManager] Dados recebidos:', data);
      console.log('📦 [ClientSitesManager] data.success:', data.success);
      console.log('📦 [ClientSitesManager] data.data:', data.data);
      console.log('📦 [ClientSitesManager] data.data is array?', Array.isArray(data.data));
      
      if (data.success) {
        // ✅ CORRIGIDO: Garantir que sempre seja um array
        // Se passou organizationId no query, o backend retorna um único site ou array com um site
        // Se não passou, retorna array com todos os sites
        let allSites: ClientSite[] = [];
        
        if (Array.isArray(data.data)) {
          allSites = data.data;
        } else if (data.data) {
          // Se retornou um único objeto, converter para array
          allSites = [data.data];
        } else {
          // Se data.data é null/undefined, array vazio
          allSites = [];
        }
        
        console.log('📦 [ClientSitesManager] Total de sites encontrados:', allSites.length);
        
        // Filtrar por organização se não for "all" (fallback caso o backend não tenha filtrado)
        const filteredSites = selectedOrgId === 'all' 
          ? allSites 
          : allSites.filter((site: ClientSite) => site.organizationId === selectedOrgId);
        
        console.log('📦 [ClientSitesManager] Sites após filtro:', filteredSites.length);
        setSites(filteredSites);
        
        if (filteredSites.length === 0 && selectedOrgId === 'all') {
          console.log('⚠️ [ClientSitesManager] Nenhum site encontrado (pode ser normal se ainda não criou nenhum)');
        }
      } else {
        // Se não encontrou site (404), apenas definir array vazio ao invés de mostrar erro
        if (response.status === 404) {
          console.log('⚠️ [ClientSitesManager] 404 - Nenhum site encontrado (normal se ainda não criou)');
          setSites([]);
        } else {
          console.error('❌ [ClientSitesManager] Erro ao carregar sites:', data.error);
          toast.error(data.error || 'Erro ao carregar sites');
          setSites([]);
        }
      }
    } catch (error) {
      console.error('❌ [ClientSitesManager] Erro ao carregar sites:', error);
      // Não mostrar toast de erro para 404 - é normal não ter site ainda
      if (!(error instanceof Error && error.message.includes('404'))) {
        toast.error('Erro ao carregar sites');
      }
      setSites([]);
    } finally {
      setLoading(false);
    }
  }, [selectedOrgId]);

  // Carregar organizações
  useEffect(() => {
    console.log('🔍 [ClientSitesManager] useEffect executado - carregando organizações');
    console.log('🔍 [ClientSitesManager] loadOrganizations type:', typeof loadOrganizations);
    console.log('🔍 [ClientSitesManager] projectId:', projectId);
    console.log('🔍 [ClientSitesManager] publicAnonKey:', publicAnonKey ? 'present' : 'missing');
    
    loadOrganizations();
    
    // Verificar se há uma organização pré-selecionada do TenantManagement
    const preselectedOrg = localStorage.getItem('selectedOrgForSite');
    if (preselectedOrg) {
      console.log('🔍 [ClientSitesManager] Organização pré-selecionada encontrada:', preselectedOrg);
      setSelectedOrgId(preselectedOrg);
      localStorage.removeItem('selectedOrgForSite'); // Limpar após usar
      toast.success('Organização selecionada!');
    }
  }, [loadOrganizations]);

  // Carregar sites quando a organização mudar
  useEffect(() => {
    loadSites();
  }, [loadSites]);

  const handleCreateSite = () => {
    setSelectedSite(null);
    setShowCreateModal(true);
  };

  const handleEditSite = (site: ClientSite) => {
    setSelectedSite(site);
    setShowEditModal(true);
  };

  const handleUploadCode = (site: ClientSite) => {
    setSelectedSite(site);
    setShowCodeModal(true);
  };

  const handleUploadArchive = (site: ClientSite) => {
    setSelectedSite(site);
    setShowArchiveModal(true);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(label);
    toast.success(`${label} copiado!`);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const getSiteUrl = (site: ClientSite) => {
    return site.domain || `https://${site.subdomain}.rendizy.app`;
  };

  // ✅ NOVA FUNÇÃO: URL de preview usando rota do RENDIZY (/sites/:subdomain)
  // Funciona em localhost e produção com URLs limpas
  const getPreviewUrl = (site: ClientSite) => {
    // Detectar se está em localhost ou produção
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname.includes('localhost');
    
    if (isLocalhost) {
      // Localhost: usar rota local
      return `http://localhost:5173/sites/${site.subdomain}`;
    } else {
      // Produção: usar rota do Netlify
      return `https://adorable-biscochitos-59023a.netlify.app/sites/${site.subdomain}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando sites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Sites dos Clientes</h1>
          <p className="text-gray-600 mt-1">
            Gerencie sites customizados para cada cliente
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowDocsModal(true)} variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Documentação IA
          </Button>
          <Button onClick={() => setShowImportModal(true)} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Importar Site
          </Button>
          <Button onClick={handleCreateSite} className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Novo Site
          </Button>
        </div>
      </div>

      {/* Seletor de Imobiliária */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="org-select" className="text-sm font-medium text-gray-700 mb-2 block">
                🏢 Selecione a Imobiliária
              </Label>
              <Select
                value={selectedOrgId}
                onValueChange={setSelectedOrgId}
                disabled={loadingOrgs}
              >
                <SelectTrigger id="org-select" className="bg-white">
                  <SelectValue placeholder="Selecione uma imobiliária..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    📋 Todas as Imobiliárias ({sites.length} sites)
                  </SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name} - {org.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedOrgId !== 'all' && (
              <div className="text-sm text-gray-600 mt-6">
                <Badge variant="secondary" className="text-sm">
                  {sites.length} {sites.length === 1 ? 'site' : 'sites'}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Sites */}
      {sites.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum site criado ainda
            </h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              Crie sites customizados para seus clientes. Você pode importar designs
              de v0.dev, Bolt.ai, Figma ou criar do zero.
            </p>
            <Button onClick={handleCreateSite} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Primeiro Site
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <Card key={site.organizationId} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-1">{site.siteName}</CardTitle>
                    <CardDescription>
                      {site.organizationId}
                    </CardDescription>
                  </div>
                  <Badge variant={site.isActive ? 'default' : 'secondary'}>
                    {site.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Template */}
                <div className="flex items-center gap-2 text-sm">
                  <Code className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Template:</span>
                  <Badge variant="outline">{site.template}</Badge>
                </div>

                {/* URL */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">URL do Site:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-gray-100 px-3 py-2 rounded border border-gray-200 truncate">
                      {getSiteUrl(site)}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(getSiteUrl(site), 'URL')}
                    >
                      {copiedUrl === 'URL' ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Modalidades */}
                <div>
                  <span className="text-sm text-gray-600 mb-2 block">Modalidades:</span>
                  <div className="flex flex-wrap gap-2">
                    {site.features.shortTerm && (
                      <Badge variant="secondary">🏖️ Temporada</Badge>
                    )}
                    {site.features.longTerm && (
                      <Badge variant="secondary">🏠 Locação</Badge>
                    )}
                    {site.features.sale && (
                      <Badge variant="secondary">💰 Venda</Badge>
                    )}
                  </div>
                </div>

                {/* Status do Código e Arquivos */}
                <div className="space-y-2 pt-2 border-t">
                  {/* Status do Código */}
                  {site.siteCode ? (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Check className="h-4 w-4" />
                      <span>Código customizado enviado ({site.siteCode.length} chars)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <AlertCircle className="h-4 w-4" />
                      <span>Nenhum código importado</span>
                    </div>
                  )}

                  {/* Status do Arquivo ZIP */}
                  {site.archivePath ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <Folder className="h-4 w-4" />
                        <span>Arquivo ZIP enviado</span>
                      </div>
                      <div className="bg-gray-50 rounded p-2 text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <File className="h-3 w-3 text-gray-500" />
                          <span className="font-mono text-gray-700 truncate">{site.archivePath}</span>
                        </div>
                        
                        {/* ✅ NOVO: Status de arquivos extraídos */}
                        {site.extractedBaseUrl && site.extractedFilesCount ? (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                            <div className="flex items-center gap-2 text-green-700 font-medium mb-1">
                              <Check className="h-3 w-3" />
                              <span>Arquivos extraídos para Storage</span>
                            </div>
                            <div className="text-green-600 text-xs">
                              ✅ {site.extractedFilesCount} arquivos prontos para servir
                            </div>
                            <div className="text-green-500 text-xs mt-1 font-mono truncate">
                              {site.extractedBaseUrl.split('/').slice(-2).join('/')}...
                            </div>
                            <div className="text-green-600 text-xs mt-1">
                              🚀 Assets servidos com Content-Type correto
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                            <div className="flex items-center gap-2 text-yellow-700 text-xs">
                              <AlertCircle className="h-3 w-3" />
                              <span>Arquivos não extraídos ainda</span>
                            </div>
                            <div className="text-yellow-600 text-xs mt-1">
                              ⚠️ Faça upload novamente para extrair arquivos e melhorar performance
                            </div>
                          </div>
                        )}
                        
                        {site.source && (
                          <div className="text-gray-500 mt-1">
                            Fonte: <Badge variant="outline" className="text-xs">{site.source}</Badge>
                          </div>
                        )}
                        {site.archiveUrl && (
                          <a 
                            href={site.archiveUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-xs mt-1 block"
                          >
                            🔗 Baixar arquivo
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <AlertCircle className="h-4 w-4" />
                      <span>Nenhum arquivo ZIP enviado</span>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => window.open(getPreviewUrl(site), '_blank')}
                    title={`Preview do site: ${getSiteUrl(site)}`}
                  >
                    <Eye className="h-4 w-4" />
                    Ver Site
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => handleUploadCode(site)}
                    title="Upload de código HTML/React"
                  >
                    <Code className="h-4 w-4" />
                    Código
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => handleUploadArchive(site)}
                    title="Upload de arquivo ZIP/TAR"
                  >
                    <Upload className="h-4 w-4" />
                    ZIP
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => handleEditSite(site)}
                    title="Editar configurações do site"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Criar Site */}
      <CreateSiteModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          loadSites();
          setShowCreateModal(false);
        }}
        prefilledOrgId={selectedOrgId !== 'all' ? selectedOrgId : undefined}
      />

      {/* Modal Editar Site */}
      {selectedSite && (
        <EditSiteModal
          site={selectedSite}
          open={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedSite(null);
          }}
          onSuccess={() => {
            loadSites();
            setShowEditModal(false);
            setSelectedSite(null);
          }}
        />
      )}

      {/* Modal Upload Código */}
      {selectedSite && (
        <UploadCodeModal
          site={selectedSite}
          open={showCodeModal}
          onClose={() => {
            setShowCodeModal(false);
            setSelectedSite(null);
          }}
          onSuccess={() => {
            loadSites();
            setShowCodeModal(false);
            setSelectedSite(null);
          }}
        />
      )}

      {/* Modal Upload Arquivo ZIP */}
      {selectedSite && (
        <UploadArchiveModal
          site={selectedSite}
          open={showArchiveModal}
          onClose={() => {
            setShowArchiveModal(false);
            setSelectedSite(null);
          }}
          onSuccess={() => {
            loadSites();
            setShowArchiveModal(false);
            setSelectedSite(null);
          }}
        />
      )}

      {/* Modal Documentação IA */}
      <DocsAIModal
        open={showDocsModal}
        onClose={() => setShowDocsModal(false)}
      />

      {/* Modal Importar Site */}
      <ImportSiteModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          loadSites();
          setShowImportModal(false);
        }}
        organizations={organizations}
      />
    </div>
  );
}

// ============================================================
// MODAL: CRIAR SITE
// ============================================================

function CreateSiteModal({ open, onClose, onSuccess, prefilledOrgId }: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  prefilledOrgId?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    organizationId: prefilledOrgId || '',
    siteName: '',
    template: 'moderno',
    contactEmail: '',
    contactPhone: '',
    shortTerm: true,
    longTerm: false,
    sale: false
  });

  // Atualizar organizationId quando prefilledOrgId mudar
  useEffect(() => {
    if (prefilledOrgId) {
      setFormData(prev => ({ ...prev, organizationId: prefilledOrgId }));
    }
  }, [prefilledOrgId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.organizationId || !formData.siteName) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/rendizy-server/make-server-67caf26a/client-sites`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            organizationId: formData.organizationId,
            siteName: formData.siteName,
            template: formData.template,
            siteConfig: {
              title: formData.siteName,
              description: `Site oficial de ${formData.siteName}`,
              contactEmail: formData.contactEmail,
              contactPhone: formData.contactPhone
            },
            features: {
              shortTerm: formData.shortTerm,
              longTerm: formData.longTerm,
              sale: formData.sale
            }
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        onSuccess();
      } else {
        toast.error(data.error || 'Erro ao criar site');
      }
    } catch (error) {
      console.error('Erro ao criar site:', error);
      toast.error('Erro ao criar site');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Novo Site</DialogTitle>
          <DialogDescription>
            Configure um novo site para um cliente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {prefilledOrgId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-800">
                <div className="text-2xl">🏢</div>
                <div>
                  <p className="text-sm font-medium">Criando site para:</p>
                  <p className="text-lg">{prefilledOrgId}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="organizationId">ID da Organização *</Label>
              <Input
                id="organizationId"
                value={formData.organizationId}
                onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                placeholder="org_123456"
                required
                disabled={!!prefilledOrgId}
                className={prefilledOrgId ? 'bg-gray-100' : ''}
              />
              {prefilledOrgId && (
                <p className="text-xs text-gray-500">
                  Organização selecionada automaticamente
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="siteName">Nome do Site *</Label>
              <Input
                id="siteName"
                value={formData.siteName}
                onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                placeholder="Imobiliária Sol"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template">Template</Label>
            <Select
              value={formData.template}
              onValueChange={(value) => setFormData({ ...formData, template: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="moderno">Moderno</SelectItem>
                <SelectItem value="classico">Clássico</SelectItem>
                <SelectItem value="luxo">Luxo</SelectItem>
                <SelectItem value="custom">Customizado (você vai enviar o código)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email de Contato</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="contato@imobiliaria.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Telefone</Label>
              <Input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Modalidades do Site</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="shortTerm" className="font-normal">
                  🏖️ Aluguel de Temporada
                </Label>
                <Switch
                  id="shortTerm"
                  checked={formData.shortTerm}
                  onCheckedChange={(checked) => setFormData({ ...formData, shortTerm: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="longTerm" className="font-normal">
                  🏠 Locação Residencial
                </Label>
                <Switch
                  id="longTerm"
                  checked={formData.longTerm}
                  onCheckedChange={(checked) => setFormData({ ...formData, longTerm: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sale" className="font-normal">
                  💰 Venda
                </Label>
                <Switch
                  id="sale"
                  checked={formData.sale}
                  onCheckedChange={(checked) => setFormData({ ...formData, sale: checked })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Site'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// MODAL: EDITAR SITE
// ============================================================

function EditSiteModal({ site, open, onClose, onSuccess }: {
  site: ClientSite;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    siteName: site.siteName,
    template: site.template,
    title: site.siteConfig.title,
    description: site.siteConfig.description,
    slogan: site.siteConfig.slogan || '',
    contactEmail: site.siteConfig.contactEmail,
    contactPhone: site.siteConfig.contactPhone,
    facebook: site.siteConfig.socialMedia?.facebook || '',
    instagram: site.siteConfig.socialMedia?.instagram || '',
    whatsapp: site.siteConfig.socialMedia?.whatsapp || '',
    primaryColor: site.theme.primaryColor,
    secondaryColor: site.theme.secondaryColor,
    accentColor: site.theme.accentColor,
    fontFamily: site.theme.fontFamily,
    shortTerm: site.features.shortTerm,
    longTerm: site.features.longTerm,
    sale: site.features.sale,
    isActive: site.isActive
  });

  // Função para salvar dados (sem auto-save para evitar loops)
  const saveData = useCallback(async (data: typeof formData) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/rendizy-server/make-server-67caf26a/client-sites/${site.organizationId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            siteName: data.siteName,
            template: data.template,
            theme: {
              primaryColor: data.primaryColor,
              secondaryColor: data.secondaryColor,
              accentColor: data.accentColor,
              fontFamily: data.fontFamily
            },
            siteConfig: {
              title: data.title,
              description: data.description,
              slogan: data.slogan,
              contactEmail: data.contactEmail,
              contactPhone: data.contactPhone,
              socialMedia: {
                facebook: data.facebook,
                instagram: data.instagram,
                whatsapp: data.whatsapp
              }
            },
            features: {
              shortTerm: data.shortTerm,
              longTerm: data.longTerm,
              sale: data.sale
            },
            isActive: data.isActive
          })
        }
      );

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao salvar');
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao salvar:', error);
      throw error;
    }
  }, [site.organizationId]);

  // Estado para controlar status de salvamento (sem auto-save)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      setSaveStatus('saving');
      
      const result = await saveData(formData);
      
      if (result.success) {
        setSaveStatus('saved');
        toast.success('Alterações salvas com sucesso!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      } else {
        setSaveStatus('error');
        toast.error(result.error || 'Erro ao salvar alterações');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setSaveStatus('error');
      toast.error('Erro ao salvar alterações');
    } finally {
      setLoading(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleClose = () => {
    if (saveStatus === 'saving') {
      toast.info('Aguarde, salvando alterações...');
      return;
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Editar Site: {site.siteName}</span>
            {saveStatus === 'saving' && (
              <span className="text-sm text-blue-600 font-normal">Salvando automaticamente...</span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-sm text-green-600 font-normal flex items-center gap-1">
                <Check className="w-4 h-4" /> Salvo
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Personalize seu site. As alterações são salvas automaticamente.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="geral" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="contato">Contato</TabsTrigger>
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="recursos">Recursos</TabsTrigger>
            <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
          </TabsList>

          {/* ABA: GERAL */}
          <TabsContent value="geral" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Nome do Site *</Label>
              <Input
                id="siteName"
                value={formData.siteName}
                onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                placeholder="Minha Imobiliária"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título (SEO) *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título que aparece no Google"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (SEO)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do site que aparece no Google"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slogan">Slogan</Label>
              <Input
                id="slogan"
                value={formData.slogan}
                onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                placeholder="Seu refúgio perfeito"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Template</Label>
              <Select
                value={formData.template}
                onValueChange={(value: any) => setFormData({ ...formData, template: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moderno">🎨 Moderno</SelectItem>
                  <SelectItem value="classico">🏛️ Clássico</SelectItem>
                  <SelectItem value="luxo">💎 Luxo</SelectItem>
                  <SelectItem value="custom">⚙️ Customizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* ABA: CONTATO */}
          <TabsContent value="contato" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="contato@imobiliaria.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Telefone *</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="5511999999999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={formData.facebook}
                onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                placeholder="https://facebook.com/..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="https://instagram.com/..."
              />
            </div>
          </TabsContent>

          {/* ABA: DESIGN */}
          <TabsContent value="design" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Cor Primária</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Cor Secundária</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    placeholder="#8B5CF6"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accentColor">Cor de Destaque</Label>
                <div className="flex gap-2">
                  <Input
                    id="accentColor"
                    type="color"
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    placeholder="#F59E0B"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fontFamily">Fonte</Label>
              <Select
                value={formData.fontFamily}
                onValueChange={(value) => setFormData({ ...formData, fontFamily: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter (Moderno)</SelectItem>
                  <SelectItem value="Poppins">Poppins (Clean)</SelectItem>
                  <SelectItem value="Playfair Display">Playfair Display (Elegante)</SelectItem>
                  <SelectItem value="Roboto">Roboto (Neutro)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* ABA: RECURSOS */}
          <TabsContent value="recursos" className="space-y-4">
            <div className="space-y-3">
              <Label>Modalidades Ativas no Site</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <Label htmlFor="shortTerm" className="font-normal">
                    🏖️ Aluguel de Temporada
                  </Label>
                  <Switch
                    id="shortTerm"
                    checked={formData.shortTerm}
                    onCheckedChange={(checked) => setFormData({ ...formData, shortTerm: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <Label htmlFor="longTerm" className="font-normal">
                    🏠 Locação Residencial
                  </Label>
                  <Switch
                    id="longTerm"
                    checked={formData.longTerm}
                    onCheckedChange={(checked) => setFormData({ ...formData, longTerm: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <Label htmlFor="sale" className="font-normal">
                    💰 Venda
                  </Label>
                  <Switch
                    id="sale"
                    checked={formData.sale}
                    onCheckedChange={(checked) => setFormData({ ...formData, sale: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <Label htmlFor="isActive" className="font-medium text-blue-900">
                    Site Ativo
                  </Label>
                  <p className="text-sm text-blue-700">
                    {formData.isActive ? 'Site visível publicamente' : 'Site em manutenção'}
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>
          </TabsContent>

          {/* ABA: ARQUIVOS */}
          <TabsContent value="arquivos" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">📦 Upload de Arquivo ZIP/TAR</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Envie um arquivo ZIP ou TAR.GZ com o código completo do site. O arquivo será armazenado no Supabase Storage.
                  <br />
                  <strong>💡 Dica:</strong> Se você usou o Bolt, peça para ele compilar o site ("Compile este site para produção") e o ZIP já virá com a pasta <code>dist/</code> incluída, tornando o site pronto para uso imediato.
                </p>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="archiveFileEdit">Arquivo (.zip ou .tar.gz)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="archiveFileEdit"
                        type="file"
                        accept=".zip,.tar.gz,.tgz"
                        onChange={async (e) => {
                          const selectedFile = e.target.files?.[0] || null;
                          if (selectedFile) {
                            try {
                              setLoading(true);
                              const formData = new FormData();
                              formData.append('file', selectedFile);
                              formData.append('source', site.source || 'custom');

                              const response = await fetch(
                                `https://${projectId}.supabase.co/functions/v1/rendizy-server/make-server-67caf26a/client-sites/${site.organizationId}/upload-archive`,
                                {
                                  method: 'POST',
                                  headers: {
                                    'Authorization': `Bearer ${publicAnonKey}`
                                  },
                                  body: formData
                                }
                              );

                              const data = await response.json();

                              if (data.success) {
                                toast.success('Arquivo enviado com sucesso!');
                                onSuccess();
                              } else {
                                toast.error(data.error || 'Erro ao enviar arquivo');
                              }
                            } catch (error) {
                              console.error('Erro ao enviar arquivo:', error);
                              toast.error('Erro ao enviar arquivo');
                            } finally {
                              setLoading(false);
                            }
                          }
                        }}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status do Arquivo Atual */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-2">📁 Arquivos do Site</h3>
                
                {site.archivePath ? (
                  <div className="space-y-3">
                    {/* Status do ZIP */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Folder className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-green-900">Arquivo ZIP Encontrado</span>
                        </div>
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          {site.source || 'custom'}
                        </Badge>
                      </div>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <File className="h-4 w-4 text-gray-500" />
                          <code className="text-xs bg-white px-2 py-1 rounded border border-green-200 text-gray-700">
                            {site.archivePath}
                          </code>
                        </div>
                        {site.archiveUrl && (
                          <a 
                            href={site.archiveUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm inline-flex items-center gap-1"
                          >
                            <Download className="h-4 w-4" />
                            Baixar arquivo
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Status dos Arquivos Extraídos */}
                    {site.extractedBaseUrl ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-blue-600" />
                            <span className="font-medium text-blue-900">✅ Arquivos Extraídos para Storage</span>
                          </div>
                          {site.extractedFilesCount && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              {site.extractedFilesCount} arquivos
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 space-y-2">
                          <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">✅ Vantagens:</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                              <li>Assets servidos com Content-Type correto</li>
                              <li>Melhor performance (cache nativo do Storage)</li>
                              <li>Site funcionando completamente</li>
                            </ul>
                          </div>
                          {site.extractedBaseUrl && (
                            <div className="text-xs text-gray-600 mt-2">
                              <code className="bg-white px-2 py-1 rounded border border-blue-200">
                                {site.extractedBaseUrl}/{site.organizationId}/extracted/
                              </code>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-yellow-800 mb-2">
                          <AlertCircle className="h-5 w-5" />
                          <span className="font-medium">Arquivos não extraídos ainda</span>
                        </div>
                        <p className="text-sm text-yellow-700">
                          ⚠️ O ZIP foi enviado, mas os arquivos ainda não foram extraídos para o Storage.
                          <br />
                          <strong>Faça upload novamente</strong> do ZIP acima para extrair automaticamente todos os arquivos e melhorar a performance do site.
                        </p>
                        <p className="text-xs text-gray-600 mt-2">
                          ℹ️ O site funciona mesmo sem extração, mas com performance reduzida (assets servidos via Edge Function).
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">Nenhum arquivo enviado</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-2">
                      Faça upload de um arquivo ZIP ou TAR.GZ acima para começar.
                    </p>
                  </div>
                )}

                {site.siteCode ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
                    <div className="flex items-center gap-2 text-blue-800 mb-2">
                      <Code className="h-5 w-5" />
                      <span className="font-medium">Código HTML/React Enviado</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Tamanho: {site.siteCode.length.toLocaleString()} caracteres
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <AlertCircle className="h-5 w-5" />
                      <span className="text-sm">Nenhum código HTML/React enviado</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? 'Salvando...' : 'Fechar'}
          </Button>
          <Button 
            onClick={handleSaveChanges}
            disabled={loading || saveStatus === 'saving'}
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// MODAL: UPLOAD CÓDIGO
// ============================================================

function UploadCodeModal({ site, open, onClose, onSuccess }: {
  site: ClientSite;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [siteCode, setSiteCode] = useState(site.siteCode || '');

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/rendizy-server/make-server-67caf26a/client-sites/${site.organizationId}/upload-code`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ siteCode })
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        onSuccess();
      } else {
        toast.error(data.error || 'Erro ao enviar código');
      }
    } catch (error) {
      console.error('Erro ao enviar código:', error);
      toast.error('Erro ao enviar código');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Upload Código do Site</DialogTitle>
          <DialogDescription>
            Cole aqui o código React/HTML gerado por v0.dev, Bolt.ai, Figma Make, etc
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={siteCode}
            onChange={(e) => setSiteCode(e.target.value)}
            placeholder="Cole o código do site aqui..."
            className="min-h-[400px] font-mono text-sm"
          />
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 Dica:</h4>
            <p className="text-sm text-blue-800">
              O código será automaticamente integrado ao backend do RENDIZY.
              Dados de imóveis, reservas e calendário virão da API RENDIZY.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !siteCode}>
            {loading ? 'Enviando...' : 'Enviar Código'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// MODAL: UPLOAD ARQUIVO ZIP
// ============================================================

function UploadArchiveModal({ site, open, onClose, onSuccess }: {
  site: ClientSite;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState<'bolt' | 'v0' | 'figma' | 'custom'>(site.source || 'custom');
  const [uploadStep, setUploadStep] = useState<number>(0); // 0 = idle, 1 = abrindo zip, 2 = conferindo, 3 = arquivos corretos, 4 = concluído
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Selecione um arquivo ZIP com a pasta dist/ compilada');
      return;
    }

    try {
      setLoading(true);
      setUploadStep(1); // Abrindo ZIP
      setUploadSuccess(false);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('source', source);

      console.log('📤 [UploadArchiveModal] Enviando arquivo:', file.name);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/rendizy-server/make-server-67caf26a/client-sites/${site.organizationId}/upload-archive`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: formData
        }
      );

      console.log('📥 [UploadArchiveModal] Status:', response.status);

      const data = await response.json();
      console.log('📦 [UploadArchiveModal] Resposta:', data);

      if (data.success) {
        // ✅ CORRIGIDO: Usar progresso real do backend ao invés de simular
        // O backend retorna data.steps com informações reais do progresso
        if (data.steps && Array.isArray(data.steps)) {
          // Contar quantos steps foram completados
          const completedSteps = data.steps.filter((s: any) => s.status === 'completed').length;
          setUploadStep(Math.min(completedSteps + 1, 5)); // Máximo 5 steps (incluindo extração)
        } else {
          // Fallback: se não tiver steps, assumir que todos foram completados
          setUploadStep(3); // Arquivos corretos
        }
        
        // Mostrar validação detalhada se disponível
        if (data.data?.validation) {
          const validation = data.data.validation;
          console.log('✅ [UploadArchiveModal] Validação:', validation);
          console.log(`✅ [UploadArchiveModal] Arquivos em dist/: ${validation.distFilesCount || 0}`);
          console.log(`✅ [UploadArchiveModal] Arquivos JS: ${validation.jsFilesCount || 0}`);
          console.log(`✅ [UploadArchiveModal] Arquivos CSS: ${validation.cssFilesCount || 0}`);
        }
        
        // ✅ NOVO: Mostrar progresso de extração
        if (data.data?.extractedFilesCount) {
          console.log(`✅ [UploadArchiveModal] Arquivos extraídos: ${data.data.extractedFilesCount}`);
          setUploadStep(4); // Extraindo arquivos
          
          // Simular progresso de extração (backend já fez, mas mostramos feedback)
          setTimeout(() => {
            setUploadStep(5); // Concluído
            setUploadSuccess(true);
          }, 1000);
        } else {
          // Se não tiver arquivos extraídos, marcar como concluído direto
          setTimeout(() => {
            setUploadStep(5); // Concluído
            setUploadSuccess(true);
          }, 300);
        }
        
        // Mensagem de sucesso com detalhes
        const successMessage = data.data?.extractedFilesCount 
          ? `✅ ${data.data.extractedFilesCount} arquivos extraídos e prontos para servir!`
          : (data.message || 'Arquivo validado e enviado com sucesso!');
        
        toast.success(successMessage);
        
        // Aguardar 2 segundos antes de fechar e recarregar
        setTimeout(() => {
          onSuccess(); // Isso deve recarregar a lista de sites
          onClose();
        }, 2000);
      } else {
        setUploadStep(0);
        // Mostrar erro detalhado se disponível
        if (data.validation) {
          console.error('❌ [UploadArchiveModal] Erro de validação:', data.validation);
          toast.error(data.error || 'Erro ao validar arquivo');
        } else {
          toast.error(data.error || 'Erro ao validar arquivo');
        }
      }
    } catch (error) {
      console.error('❌ [UploadArchiveModal] Erro ao enviar arquivo:', error);
      setUploadStep(0);
      toast.error('Erro ao enviar arquivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Arquivo ZIP</DialogTitle>
          <DialogDescription>
            Envie um arquivo ZIP compilado com a pasta dist/ do site {site.siteName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Fonte */}
          <div className="space-y-2">
            <Label>Fonte do Site</Label>
            <div className="grid grid-cols-4 gap-2">
              {(['bolt', 'v0', 'figma', 'custom'] as const).map((src) => (
                <Button
                  key={src}
                  type="button"
                  variant={source === src ? 'default' : 'outline'}
                  onClick={() => setSource(src)}
                  className="capitalize"
                >
                  {src}
                </Button>
              ))}
            </div>
          </div>

          {/* Arquivo */}
          <div className="space-y-2">
            <Label htmlFor="archiveFile">Arquivo ZIP com pasta dist/ (obrigatório)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="archiveFile"
                type="file"
                accept=".zip"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0] || null;
                  setFile(selectedFile);
                  setUploadStep(0);
                  setUploadSuccess(false);
                  if (selectedFile) {
                    toast.success(`Arquivo selecionado: ${selectedFile.name}`);
                  }
                }}
                className="flex-1"
              />
              {file && (
                <Badge variant="secondary" className="text-xs">
                  ✓ {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              <strong>⚠️ Importante:</strong> O arquivo ZIP DEVE conter a pasta <code>dist/</code> compilada.
              <br />
              <strong>💡 Dica:</strong> O Bolt pode compilar automaticamente! Peça "Compile este site para produção" e o ZIP já virá com a pasta <code>dist/</code> incluída.
            </p>
          </div>

          {/* Barra de Progresso */}
          {loading && uploadStep > 0 && (
            <div className="space-y-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-blue-900">
                  {uploadStep === 1 && '📦 Etapa 1: Abrindo ZIP...'}
                  {uploadStep === 2 && '📋 Etapa 2: Conferindo arquivos...'}
                  {uploadStep === 3 && '✅ Etapa 3: Arquivos corretos!'}
                  {uploadStep === 4 && '📤 Etapa 4: Extraindo arquivos para Storage...'}
                  {uploadStep === 5 && '🎉 Etapa 5: Processamento concluído!'}
                </span>
                <span className="text-blue-600">{uploadStep}/5</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(uploadStep / 5) * 100}%` }}
                />
              </div>
              {uploadStep === 4 && (
                <div className="space-y-2">
                  <p className="text-xs text-blue-700 mt-2">
                    ⏳ Extraindo arquivos do ZIP e fazendo upload para Storage... Isso pode levar alguns segundos.
                  </p>
                  <p className="text-xs text-blue-600">
                    💡 <strong>O que está acontecendo:</strong>
                    <br />
                    • Extraindo todos os arquivos do ZIP
                    <br />
                    • Fazendo upload de cada arquivo para Storage
                    <br />
                    • Ajustando HTML para usar URLs do Storage
                    <br />
                    • Assets terão Content-Type correto automaticamente
                  </p>
                </div>
              )}
              {uploadStep === 5 && uploadSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                  <p className="text-sm text-green-800 font-medium mb-1">
                    ✅ Site pronto para uso!
                  </p>
                  <p className="text-xs text-green-700">
                    Os arquivos foram extraídos e estão prontos. O site agora funciona completamente com Content-Type correto.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Mensagem de Sucesso */}
          {uploadSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-medium text-green-900">Site processado com sucesso!</p>
                  <p className="text-sm text-green-700 mt-1">
                    ✅ Arquivos extraídos para Storage com Content-Type correto.
                    <br />
                    🚀 O site está pronto! Clique em "Ver Site" para visualizar.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Status atual */}
          {site.archivePath && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900 font-medium mb-1">📁 Arquivo atual:</p>
              <p className="text-xs text-blue-700 font-mono">{site.archivePath}</p>
              <p className="text-xs text-blue-600 mt-1">
                ⚠️ O novo arquivo substituirá o arquivo atual.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !file}>
            {loading ? 'Enviando...' : 'Enviar Arquivo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// MODAL: DOCUMENTAÇÃO IA (BOLT, V0, ETC)
// ============================================================

function DocsAIModal({ open, onClose }: {
  open: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [promptVersion] = useState('1.1-2025-12-01'); // Força remount quando muda

  // ✅ PROMPT ATUALIZADO v1.1 - 2025-12-01 - FORÇANDO RELOAD
  // FORÇA RELOAD: ${Date.now()}
  console.log('🔍 DocsAIModal renderizado - Versão:', promptVersion);
  const aiPrompt = `# Criar Site de Imobiliária com RENDIZY

## Objetivo
Criar um site moderno e responsivo para imobiliária de aluguel de temporada, locação e vendas, integrado ao backend RENDIZY.

## Especificações Técnicas

### Stack
- React 18+ com TypeScript
- Tailwind CSS para estilização
- Lucide React para ícones
- ShadCN/UI para componentes (opcional)

### Estrutura de Dados do Backend RENDIZY

#### 1. Propriedades (GET /properties)
\`\`\`typescript
interface Property {
  id: string;
  name: string;
  code: string; // Código único da propriedade
  description: string;
  type: string; // 'apartment' | 'house' | 'condo' | 'studio' | etc
  status: string; // 'active' | 'inactive' | 'maintenance'
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  area: number; // Área em m²
  address: {
    street: string;
    number: string;
    complement?: string; // "Apto 101", "Bloco A"
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  amenities: string[]; // Lista de comodidades
  photos: string[]; // URLs das fotos
  coverPhoto?: string; // Foto de capa
  pricing: {
    basePrice?: number; // Preço base
    currency?: string; // "BRL", "USD", etc
    dailyRate?: number; // Preço diário (temporada)
    weeklyRate?: number; // Preço semanal
    monthlyRate?: number; // Preço mensal (locação)
    salePrice?: number; // Preço de venda
    weeklyDiscount?: number; // Desconto semanal (%)
    monthlyDiscount?: number; // Desconto mensal (%)
  };
  restrictions?: {
    minNights?: number; // Mínimo de noites
    maxNights?: number; // Máximo de noites
    advanceBooking?: number; // Dias de antecedência
  };
  features: {
    shortTerm: boolean; // Aluguel de temporada
    longTerm: boolean; // Locação residencial
    sale: boolean; // Venda
  };
  locationId?: string; // ID do prédio/condomínio (se aplicável)
  organizationId: string; // ID da organização (multi-tenant)
  createdAt: string;
  updatedAt: string;
}
\`\`\`

#### 2. Calendário (GET /calendar)
\`\`\`typescript
// ✅ Parâmetros da requisição:
// - startDate: YYYY-MM-DD (obrigatório)
// - endDate: YYYY-MM-DD (obrigatório)
// - propertyId?: string (opcional - filtrar por propriedade)
// - includeBlocks?: boolean (incluir bloqueios)
// - includePrices?: boolean (incluir preços)

interface CalendarDay {
  date: string; // YYYY-MM-DD
  status: 'available' | 'booked' | 'blocked';
  price?: number; // Preço do dia (se includePrices=true)
  minNights?: number; // Mínimo de noites
  propertyId: string;
}

interface CalendarResponse {
  days: CalendarDay[];
  properties: Property[]; // Propriedades incluídas no calendário
}
\`\`\`

#### 3. Reservas (POST /reservations)
\`\`\`typescript
interface ReservationRequest {
  propertyId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
}
\`\`\`

### Páginas Obrigatórias

1. **Home** - Hero + busca + destaques
2. **Propriedades** - Lista filtrada + busca avançada
3. **Detalhes da Propriedade** - Galeria, info, calendário, formulário reserva
4. **Sobre** - História da imobiliária
5. **Contato** - Formulário + mapa

### Funcionalidades Essenciais

- ✅ Busca por cidade, datas, número de hóspedes
- ✅ Filtros por tipo, preço, comodidades
- ✅ Calendário de disponibilidade integrado
- ✅ Formulário de reserva/cotação
- ✅ Galeria de fotos responsiva
- ✅ Mapa de localização (Google Maps ou Mapbox)
- ✅ WhatsApp flutuante para contato
- ✅ Sistema de favoritos (localStorage)
- ✅ Compartilhamento em redes sociais

### Configurações do Cliente (Variáveis)

\`\`\`typescript
// ✅ Estas variáveis serão substituídas automaticamente pelo sistema RENDIZY
const siteConfig = {
  organizationId: "{{ORG_ID}}", // UUID da organização (será substituído)
  siteName: "{{SITE_NAME}}", // Nome da imobiliária
  subdomain: "{{SUBDOMAIN}}", // Ex: "suacasamobiliada" → suacasamobiliada.rendizy.com.br
  domain: "{{DOMAIN}}", // Domínio customizado (opcional) Ex: "suacasamobiliada.com.br"
  logo: "{{LOGO_URL}}", // URL do logo
  favicon: "{{FAVICON_URL}}", // URL do favicon
  theme: {
    primaryColor: "{{PRIMARY_COLOR}}", // Ex: "#3B82F6"
    secondaryColor: "{{SECONDARY_COLOR}}", // Ex: "#1F2937"
    accentColor: "{{ACCENT_COLOR}}", // Ex: "#10B981"
    fontFamily: "{{FONT_FAMILY}}" // Ex: "Inter, sans-serif"
  },
  siteConfig: {
    title: "{{TITLE}}", // Título SEO
    description: "{{DESCRIPTION}}", // Descrição SEO
    slogan: "{{SLOGAN}}", // Slogan da imobiliária
    contactEmail: "{{CONTACT_EMAIL}}",
    contactPhone: "{{CONTACT_PHONE}}",
    socialMedia: {
      facebook: "{{FACEBOOK}}",
      instagram: "{{INSTAGRAM}}",
      whatsapp: "{{WHATSAPP}}"
    }
  },
  features: {
    shortTerm: {{SHORT_TERM}}, // true/false - Aluguel de Temporada
    longTerm: {{LONG_TERM}}, // true/false - Locação Residencial
    sale: {{SALE}} // true/false - Venda
  },
  // ✅ Configurações da API
  api: {
    baseUrl: "{{API_BASE_URL}}", // URL base da API RENDIZY
    publicKey: "{{PUBLIC_ANON_KEY}}" // Chave pública do Supabase
  }
};
\`\`\`

### Integração com API RENDIZY

\`\`\`typescript
// ✅ IMPORTANTE: Substitua PROJECT_ID pelo ID do seu projeto Supabase
const PROJECT_ID = "{{PROJECT_ID}}"; // Ex: "odcgnzfremrqnvtitpcc"
const API_BASE = \`https://\${PROJECT_ID}.supabase.co/functions/v1/rendizy-server\`;

// ✅ AUTENTICAÇÃO: O sistema usa token JWT via header X-Auth-Token
// O organizationId é extraído automaticamente do token no backend
// Para sites públicos, você pode usar a publicAnonKey do Supabase
const PUBLIC_ANON_KEY = "{{PUBLIC_ANON_KEY}}"; // Chave pública do Supabase

// ✅ Buscar propriedades (organizationId é extraído automaticamente do token)
const properties = await fetch(\`\${API_BASE}/properties\`, {
  headers: {
    'Authorization': \`Bearer \${PUBLIC_ANON_KEY}\`,
    'X-Auth-Token': '{{USER_TOKEN}}', // Token JWT do usuário (opcional para sites públicos)
    'Content-Type': 'application/json'
  }
});

// ✅ Buscar disponibilidade do calendário
const availability = await fetch(
  \`\${API_BASE}/calendar?propertyId=\${propertyId}&startDate=\${startDate}&endDate=\${endDate}&includeBlocks=true&includePrices=true\`,
  {
    headers: {
      'Authorization': \`Bearer \${PUBLIC_ANON_KEY}\`,
      'X-Auth-Token': '{{USER_TOKEN}}',
      'Content-Type': 'application/json'
    }
  }
);

// ✅ Criar reserva
const reservation = await fetch(\`\${API_BASE}/reservations\`, {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${PUBLIC_ANON_KEY}\`,
    'X-Auth-Token': '{{USER_TOKEN}}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    propertyId: reservationData.propertyId,
    guestName: reservationData.guestName,
    guestEmail: reservationData.guestEmail,
    guestPhone: reservationData.guestPhone,
    checkIn: reservationData.checkIn,
    checkOut: reservationData.checkOut,
    guests: reservationData.guests,
    totalPrice: reservationData.totalPrice
  })
});

// ✅ IMPORTANTE: Para sites públicos (sem autenticação de usuário)
// Você pode fazer requisições sem X-Auth-Token, mas precisará passar organizationId
// via query param ou header customizado conforme configuração do backend
\`\`\`

### Notas Importantes sobre Autenticação

1. **Sites Públicos**: Para sites que não requerem login, use apenas \`Authorization: Bearer PUBLIC_ANON_KEY\`
2. **Multi-Tenant**: O backend identifica automaticamente a organização via token ou header
3. **Subdomínios**: Sites podem ser acessados via \`subdomain.rendizy.com.br\` ou domínio customizado
4. **CORS**: Todas as requisições devem incluir headers CORS apropriados

### Design Guidelines

- **Moderno**: Gradientes suaves, animações sutis, espaçamento generoso
- **Responsivo**: Mobile-first, breakpoints: 640px, 768px, 1024px, 1280px
- **Acessível**: Contraste adequado, alt texts, navegação por teclado
- **Performance**: Lazy loading de imagens, code splitting
- **SEO**: Meta tags, structured data, sitemap
- **Multi-tenant**: Cada site é isolado por organização (dados não se misturam)

### Sistema de Domínios

O RENDIZY suporta dois tipos de domínios:

1. **Subdomínio RENDIZY**: \`{{SUBDOMAIN}}.rendizy.com.br\`
   - Gerado automaticamente a partir do nome da imobiliária
   - Exemplo: "Sua Casa Mobiliada" → \`suacasamobiliada.rendizy.com.br\`

2. **Domínio Customizado**: \`{{DOMAIN}}\`
   - Domínio próprio do cliente (ex: \`suacasamobiliada.com.br\`)
   - Requer configuração DNS apontando para servidor RENDIZY
   - O sistema detecta automaticamente qual organização usar baseado no domínio

### Componentes Reutilizáveis

- PropertyCard
- SearchBar
- DateRangePicker
- CalendarView
- PhotoGallery
- ContactForm
- FilterSidebar
- PropertyMap

Crie um site COMPLETO, FUNCIONAL e PROFISSIONAL seguindo essas especificações.

### Compilação e Entrega

**✅ IMPORTANTE: O Bolt pode compilar o site automaticamente!**

Após gerar o código do site, você pode:

1. **Opção 1: Compilar no Bolt (Recomendado)**
   - Peça ao Bolt: "Compile este site para produção" ou "Faça o build deste projeto"
   - O Bolt irá executar npm run build automaticamente
   - O arquivo ZIP gerado já virá com a pasta dist/ incluída
   - Isso torna o site pronto para uso imediato no RENDIZY

2. **Opção 2: Compilar manualmente**
   - Baixe o projeto
   - Execute npm install e depois npm run build
   - Inclua a pasta dist/ no ZIP antes de enviar

**Vantagem da Opção 1:** O site fica pronto imediatamente após o upload, sem necessidade de compilação adicional.

---
**Versão 1.2** - Atualizado em 2025-12-01
**Build:** ${promptVersion}
`;

  const copyPrompt = () => {
    navigator.clipboard.writeText(aiPrompt);
    setCopied(true);
    toast.success('Prompt copiado! Cole no Bolt.new, v0.dev ou Figma Make');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Documentação para Criar Site com IA
          </DialogTitle>
          <DialogDescription>
            Use este prompt em Bolt.new, v0.dev, Claude, ChatGPT ou Figma Make para criar sites profissionais integrados ao RENDIZY
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Plataformas Recomendadas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2 border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Bolt.new
                </CardTitle>
                <CardDescription>Recomendado - Mais Completo</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  size="sm"
                  onClick={() => window.open('https://bolt.new', '_blank')}
                  className="w-full gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir Bolt.new
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  v0.dev
                </CardTitle>
                <CardDescription>Vercel - Componentes UI</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  size="sm"
                  onClick={() => window.open('https://v0.dev', '_blank')}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir v0.dev
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Figma Make
                </CardTitle>
                <CardDescription>Design First</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  size="sm"
                  onClick={() => window.open('https://figma.com', '_blank')}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir Figma
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base">Prompt para IA:</Label>
              <Button
                size="sm"
                variant={copied ? 'default' : 'outline'}
                onClick={copyPrompt}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar Prompt
                  </>
                )}
              </Button>
            </div>
            
            <Textarea
              key={`ai-prompt-${promptVersion}`}
              value={aiPrompt}
              readOnly
              className="min-h-[400px] font-mono text-xs bg-gray-50"
            />
          </div>

          {/* Instruções */}
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertTitle>Como Usar</AlertTitle>
            <AlertDescription className="space-y-2 mt-2">
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Clique em "Copiar Prompt"</li>
                <li>Abra Bolt.new, v0.dev ou sua IA preferida</li>
                <li>Cole o prompt completo</li>
                <li>Aguarde a IA gerar o código do site</li>
                <li><strong>💡 No Bolt:</strong> Peça "Compile este site para produção" ou "Faça o build" - o ZIP já virá compilado!</li>
                <li>Baixe o arquivo ZIP (com ou sem pasta <code>dist/</code>)</li>
                <li>Volte aqui e clique em "Upload Arquivo ZIP" no card do site</li>
                <li>Envie o ZIP e o site ficará disponível imediatamente</li>
              </ol>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// MODAL: IMPORTAR SITE DE IA/FIGMA
// ============================================================

function ImportSiteModal({ open, onClose, onSuccess, organizations }: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizations: any[];
}) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [importMode, setImportMode] = useState<'code' | 'zip' | 'drive'>('code');
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    organizationId: '',
    siteName: '',
    siteCode: '',
    source: 'bolt', // bolt, v0, figma, custom
    contactEmail: '',
    contactPhone: '',
    shortTerm: true,
    longTerm: false,
    sale: false,
    driveUrl: ''
  });

  const handleSubmit = async () => {
    if (step === 1) {
      if (!formData.organizationId || !formData.siteName) {
        toast.error('Preencha organização e nome do site');
        return;
      }

      // Se for importação por código, avançamos para o passo 2
      if (importMode === 'code') {
        setStep(2);
        return;
      }

      // Para ZIP, já validamos se há arquivo selecionado
      if (importMode === 'zip' && !zipFile) {
        toast.error('Selecione um arquivo .zip ou .tar.gz do site');
        return;
      }
    }

    if (step === 2 && importMode === 'code' && !formData.siteCode) {
      toast.error('Cole o código do site');
      return;
    }

    if (step === 1 && importMode === 'drive' && !formData.driveUrl) {
      toast.error('Informe a URL do arquivo (.zip ou .tar.gz) no Google Drive ou outro storage');
      return;
    }

    try {
      setLoading(true);

      // 1. Criar o site
      const createResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/rendizy-server/make-server-67caf26a/client-sites`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            organizationId: formData.organizationId,
            siteName: formData.siteName,
            template: 'custom',
            source: formData.source,
            siteConfig: {
              title: formData.siteName,
              description: `Site oficial de ${formData.siteName}`,
              contactEmail: formData.contactEmail,
              contactPhone: formData.contactPhone
            },
            features: {
              shortTerm: formData.shortTerm,
              longTerm: formData.longTerm,
              sale: formData.sale
            }
          })
        }
      );

      const createData = await createResponse.json();

      if (!createData.success) {
        // Se já existe site (409), perguntar se quer atualizar
        if (createResponse.status === 409) {
          const shouldUpdate = confirm(
            `Já existe um site para esta organização. Deseja atualizar o site existente com os novos dados?`
          );
          
          if (shouldUpdate) {
            // Atualizar site existente ao invés de criar
            const updateResponse = await fetch(
              `https://${projectId}.supabase.co/functions/v1/rendizy-server/make-server-67caf26a/client-sites/${formData.organizationId}`,
              {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${publicAnonKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  siteName: formData.siteName,
                  siteConfig: {
                    title: formData.siteName,
                    description: `Site oficial de ${formData.siteName}`,
                    contactEmail: formData.contactEmail,
                    contactPhone: formData.contactPhone
                  },
                  features: {
                    shortTerm: formData.shortTerm,
                    longTerm: formData.longTerm,
                    sale: formData.sale
                  }
                })
              }
            );

            const updateData = await updateResponse.json();
            
            if (!updateData.success) {
              toast.error(updateData.error || 'Erro ao atualizar site');
              setLoading(false);
              return;
            }
            
            // Continuar com o upload do arquivo/código mesmo após atualizar
            toast.success('✅ Site atualizado! Continuando com importação...');
          } else {
            toast.info('Operação cancelada. Use "Editar Site" para modificar o site existente.');
            setLoading(false);
            return;
          }
        } else {
          toast.error(createData.error || 'Erro ao criar site');
          setLoading(false);
          return;
        }
      }

      // 2. Dependendo do modo, subir código, arquivo ou apenas registrar fonte
      // ✅ CORRIGIDO: Se não houver código/arquivo para fazer upload após atualizar, finalizar aqui
      let hasUploadData = false;
      
      if (importMode === 'code') {
        hasUploadData = !!formData.siteCode;
      } else if (importMode === 'zip') {
        hasUploadData = !!zipFile;
      } else if (importMode === 'drive') {
        hasUploadData = !!formData.driveUrl;
      }
      
      // Se não houver dados para fazer upload, apenas finalizar
      if (!hasUploadData) {
        toast.success('✅ Site atualizado com sucesso!');
        onSuccess();
        setLoading(false);
        return;
      }
      
      if (importMode === 'code') {
        const uploadResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/rendizy-server/make-server-67caf26a/client-sites/${formData.organizationId}/upload-code`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ siteCode: formData.siteCode })
          }
        );

        const uploadData = await uploadResponse.json();

        if (!uploadData.success) {
          toast.error(uploadData.error || 'Erro ao importar código');
          setLoading(false);
          return;
        }

        toast.success('✅ Site importado com sucesso!');
        onSuccess();
        return;
      }

      if (importMode === 'zip' && zipFile) {
        const form = new FormData();
        form.append('file', zipFile);
        form.append('source', formData.source);

        const archiveResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/rendizy-server/make-server-67caf26a/client-sites/${formData.organizationId}/upload-archive`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`
              // Content-Type é definido automaticamente (multipart/form-data)
            },
            body: form
          }
        );

        const archiveData = await archiveResponse.json();

        if (!archiveData.success) {
          toast.error(archiveData.error || 'Erro ao enviar arquivo do site');
          setLoading(false);
          return;
        }

        toast.success('✅ Site e arquivo importados com sucesso!');
        onSuccess();
        return;
      }

      if (importMode === 'drive') {
        // Importação via URL remota (ex: arquivo .zip no Google Drive)
        if (!formData.driveUrl) {
          toast.error('Informe a URL do arquivo (.zip ou .tar.gz) no Google Drive ou outro storage');
          setLoading(false);
          return;
        }

        const driveResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/rendizy-server/make-server-67caf26a/client-sites/${formData.organizationId}/upload-archive-from-url`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              url: formData.driveUrl,
              source: formData.source
            })
          }
        );

        const driveData = await driveResponse.json();

        if (!driveData.success) {
          toast.error(driveData.error || 'Erro ao importar arquivo remoto do site');
          setLoading(false);
          return;
        }

        toast.success('✅ Site criado e arquivo remoto associado com sucesso!');
        onSuccess();
        return;
      }
    } catch (error) {
      console.error('Erro ao importar site:', error);
      toast.error('Erro ao importar site');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Importar Site de IA/Figma
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Escolha a origem e configure os dados básicos do site'
              : importMode === 'code'
                ? 'Cole o código gerado pela IA'
                : 'Revise e envie os arquivos do site'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-6">
            {/* Origem */}
            <div className="space-y-2">
              <Label>De onde está importando?</Label>
              <div className="grid grid-cols-4 gap-2">
                {['bolt', 'v0', 'figma', 'custom'].map((source) => (
                  <Button
                    key={source}
                    variant={formData.source === source ? 'default' : 'outline'}
                    onClick={() => setFormData({ ...formData, source })}
                    className="capitalize"
                  >
                    {source}
                  </Button>
                ))}
              </div>
            </div>

            {/* Modo de importação */}
            <div className="space-y-2">
              <Label>Como deseja importar?</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={importMode === 'code' ? 'default' : 'outline'}
                  onClick={() => setImportMode('code')}
                  className="text-sm"
                >
                  Colar Código
                </Button>
                <Button
                  variant={importMode === 'zip' ? 'default' : 'outline'}
                  onClick={() => setImportMode('zip')}
                  className="text-sm"
                >
                  Upload .zip
                </Button>
                <Button
                  variant={importMode === 'drive' ? 'default' : 'outline'}
                  onClick={() => setImportMode('drive')}
                  className="text-sm"
                >
                  Link Google Drive
                </Button>
              </div>
            </div>

            {/* Organização */}
            <div className="space-y-2">
              <Label htmlFor="organizationId">Imobiliária *</Label>
              <Select
                value={formData.organizationId}
                onValueChange={(value) => setFormData({ ...formData, organizationId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a imobiliária..." />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name} - {org.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nome do Site */}
            <div className="space-y-2">
              <Label htmlFor="siteName">Nome do Site *</Label>
              <Input
                id="siteName"
                value={formData.siteName}
                onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                placeholder="Ex: Sua Casa Mobiliada"
              />
            </div>

            {/* Contatos */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="contato@imobiliaria.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Telefone</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            {importMode === 'drive' && (
              <div className="space-y-2">
                <Label htmlFor="driveUrl">URL do arquivo (.zip ou .tar.gz) no Google Drive ou outro storage</Label>
                <Input
                  id="driveUrl"
                  value={formData.driveUrl}
                  onChange={(e) => setFormData({ ...formData, driveUrl: e.target.value })}
                  placeholder="Cole aqui o link direto para o arquivo compactado do site (ex: ZIP do Bolt no Google Drive)"
                />
                <p className="text-xs text-muted-foreground">
                  Gere um link compartilhável do arquivo compactado (não da pasta). No Google Drive, certifique-se de que
                  o link permite leitura pública ou que o backend tenha permissão para acessar.
                </p>
              </div>
            )}

            {importMode === 'zip' && (
              <div className="space-y-2">
                <Label htmlFor="zipFile">Arquivo do site (.zip ou .tar.gz)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="zipFile"
                    type="file"
                    accept=".zip,.tar.gz,.tgz"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setZipFile(file);
                      if (file) {
                        toast.success(`Arquivo selecionado: ${file.name}`);
                      }
                    }}
                    className="flex-1"
                  />
                  {zipFile && (
                    <Badge variant="secondary" className="text-xs">
                      ✓ {zipFile.name}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selecione o arquivo compactado gerado pelo Bolt, v0, Figma ou outra ferramenta, contendo a pasta do
                  projeto (ex: <code>src/</code>, <code>public/</code>, etc.).
                  <br />
                  <strong>💡 Dica:</strong> Se você usou o Bolt, peça para ele compilar o site ("Compile este site para produção") e o ZIP já virá com a pasta <code>dist/</code> incluída, tornando o site pronto para uso imediato.
                </p>
              </div>
            )}

            {/* Modalidades */}
            <div className="space-y-3">
              <Label>Modalidades</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="shortTerm2" className="font-normal">🏖️ Temporada</Label>
                  <Switch
                    id="shortTerm2"
                    checked={formData.shortTerm}
                    onCheckedChange={(checked) => setFormData({ ...formData, shortTerm: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="longTerm2" className="font-normal">🏠 Locação</Label>
                  <Switch
                    id="longTerm2"
                    checked={formData.longTerm}
                    onCheckedChange={(checked) => setFormData({ ...formData, longTerm: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sale2" className="font-normal">💰 Venda</Label>
                  <Switch
                    id="sale2"
                    checked={formData.sale}
                    onCheckedChange={(checked) => setFormData({ ...formData, sale: checked })}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : importMode === 'code' ? (
          <div className="space-y-4">
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertTitle>Cole o código gerado pela IA</AlertTitle>
              <AlertDescription>
                Copie todo o código React/TypeScript gerado e cole abaixo
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Código do Site</Label>
              <Textarea
                value={formData.siteCode}
                onChange={(e) => setFormData({ ...formData, siteCode: e.target.value })}
                placeholder="Cole o código completo aqui..."
                className="min-h-[400px] font-mono text-xs"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>✨ O sistema irá:</strong>
                <br />• Integrar automaticamente com a API RENDIZY
                <br />• Substituir variáveis de configuração
                <br />• Conectar ao banco de dados de imóveis
                <br />• Configurar calendário e reservas
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Importação via código:</strong> use quando a IA gerou um único componente
                ou página principal. Para projetos completos (pasta com src/, public/, etc.),
                prefira a opção de upload .zip.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {importMode === 'zip' && (
              <>
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertTitle>Upload de projeto completo (.zip / .tar.gz)</AlertTitle>
                  <AlertDescription>
                    Envie o arquivo compactado gerado pelo Bolt, v0.dev ou outro gerador.
                    O RENDIZY irá armazenar esse pacote vinculado à organização e ao site,
                    permitindo automações de deploy no futuro.
                    <br />
                    <strong>💡 Dica:</strong> Se você usou o Bolt, peça para ele compilar o site ("Compile este site para produção") e o ZIP já virá com a pasta <code>dist/</code> incluída, tornando o site pronto para uso imediato.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Arquivo do Site (.zip ou .tar.gz)</Label>
                  <Input
                    type="file"
                    accept=".zip,.tar.gz,.tgz"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setZipFile(file);
                    }}
                  />
                  {zipFile && (
                    <p className="text-xs text-gray-600">
                      Selecionado: {zipFile.name} ({Math.round(zipFile.size / 1024)} KB)
                    </p>
                  )}
                </div>
              </>
            )}

            {importMode === 'drive' && (
              <>
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertTitle>Integração com Google Drive (fase 1)</AlertTitle>
                  <AlertDescription>
                    Nesta primeira versão, o RENDIZY registra o site normalmente.
                    A sincronização automática com uma pasta do Google Drive poderá ser
                    configurada por uma rotina dedicada em uma próxima etapa.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Link da pasta ou arquivo no Google Drive</Label>
                  <Input
                    placeholder="https://drive.google.com/..."
                    value={formData.siteCode}
                    onChange={(e) =>
                      setFormData({ ...formData, siteCode: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-600">
                    O link será armazenado nos metadados do site para uso futuro
                    por processos de sincronização/implantação.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 2 && importMode === 'code' && (
            <Button variant="outline" onClick={() => setStep(1)}>
              Voltar
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading
              ? 'Importando...'
              : step === 1 && importMode === 'code'
                ? 'Próximo'
                : 'Importar Site'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
