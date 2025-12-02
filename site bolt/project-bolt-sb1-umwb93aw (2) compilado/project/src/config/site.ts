export const siteConfig = {
  organizationId: "{{ORG_ID}}",
  siteName: "MedHome",
  subdomain: "medhome",
  domain: "medhome.com.br",
  logo: "/medhome_logo_hibrida_vertical logo oficial.png",
  logoIcon: "/medhome_logo_icone.png",
  favicon: "/medhome_logo_icone.png",
  theme: {
    primaryColor: "#5DBEBD",
    secondaryColor: "#FF8B94",
    accentColor: "#10B981",
    fontFamily: "Inter, sans-serif"
  },
  siteConfig: {
    title: "MedHome - Acomodações Humanizadas para Tratamento Médico",
    description: "Acomodações humanizadas para pacientes em tratamento. Conforto, cuidado e proximidade aos principais centros médicos.",
    slogan: "Conforto e cuidado quando você mais precisa",
    contactEmail: "contato@medhome.com.br",
    contactPhone: "(11) 99999-9999",
    socialMedia: {
      facebook: "https://facebook.com/medhome",
      instagram: "https://instagram.com/medhome",
      whatsapp: "5511999999999"
    }
  },
  features: {
    shortTerm: true,
    longTerm: true,
    sale: false
  },
  api: {
    projectId: "{{PROJECT_ID}}",
    baseUrl: "{{API_BASE_URL}}",
    publicAnonKey: "{{PUBLIC_ANON_KEY}}"
  }
};

export const API_CONFIG = {
  projectId: import.meta.env.VITE_SUPABASE_PROJECT_ID || "0ec90b57d6e95fcbda19832f",
  get baseUrl() {
    return `https://${this.projectId}.supabase.co/functions/v1/rendizy-server`;
  },
  publicAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw",
  organizationId: siteConfig.organizationId
};
