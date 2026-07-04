import { useAuth } from "./auth/AuthProvider";
import LoginPage from "./LoginPage";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./lib/supabase";
import { asaBestiary } from "./data/asaBestiary";

import {
  ATTR_KEYS,
  MISSIONS_CATALOG,
  NEX_VALUES,
  TRAINING_BONUS,
  TRAINING_LABEL,
  TRAINING_THEME,
  classBaseAbilities,
  classInfo,
  classPowers,
  colors,
  createDefaultSkillState,
  getPowerSlots,
  getUnlocksForNexRange,
  itemsCatalog,
  originDescription,
  originPowerDesc,
  originPowerName,
  originsData,
  paranormalPowers,
  rituaisCatalog,
  rulesByClass,
  skillsCatalog,
  trilhasData,
} from "./data/gameData";
import {
  CURSE_EFFECTS,
  CURSE_ELEMENT,
  CURSE_FULL_DESC,
  ELEMENT_COLORS,
  MOD_EFFECTS,
  MOD_FULL_DESC,
  OPPRESSOR_ELEMENTS,
  applyWeaponCurses,
  applyWeaponModifications,
  getAllowedCursesForItem,
  getAllowedModsForItem,
} from "./domain/itemRules";
import { canManageTable, isUuid, normalizeRole } from "./domain/roles";

const emptyMonsterDraft = {
  name: "",
  vd: "",
  type: "",
  defense: "",
  hp: "",
  senses: "",
  resistances: "",
  vulnerabilities: "",
  traitsText: "",
  actionsText: "",
};

function slugifyMonsterName(value) {
  return String(value || "monstro")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseLines(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseMonsterActions(value) {
  return parseLines(value).map((line) => {
    const [rawName, ...rest] = line.split(":");
    const name = rawName?.trim() || "Acao";
    return {
      name,
      type: "Custom",
      text: rest.join(":").trim() || line,
    };
  });
}

function monsterFromDraft(draft) {
  return {
    id: `custom-${slugifyMonsterName(draft.name)}-${Date.now()}`,
    custom: true,
    name: draft.name.trim(),
    vd: Number(draft.vd) || 0,
    type: draft.type.trim() || "Ameaca customizada",
    defense: draft.defense.trim(),
    hp: draft.hp.trim(),
    senses: draft.senses.trim(),
    resistances: draft.resistances.trim(),
    vulnerabilities: draft.vulnerabilities.trim(),
    traits: parseLines(draft.traitsText),
    actions: parseMonsterActions(draft.actionsText),
  };
}

const styles = {
  selectField: {
    width: "100%",
    background: "#000",
    color: colors.brand,
    padding: "10px",
    border: `1px solid ${colors.brand}33`,
    outline: "none",
    borderRadius: "8px",
    fontFamily: "inherit",
  },
  popupOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.72)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9998,
    padding: "20px",
  },
  popupBox: {
    width: "100%",
    maxWidth: "720px",
    background: "rgba(10, 10, 16, 0.94)",
    border: `1px solid ${colors.brand}33`,
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 0 24px rgba(0, 229, 255, 0.18)",
  },
  popupItem: {
    background: "rgba(0,0,0,0.35)",
    borderLeft: `3px solid ${colors.brand}`,
    padding: "12px",
    borderRadius: "0 8px 8px 0",
    marginBottom: "10px",
  },
  body: {
    color: colors.text,
    fontFamily: "'Share Tech Mono', monospace",
    minHeight: "100vh",
    display: "flex",
    backgroundColor: colors.background,
    backgroundImage: "url('https://i.imgur.com/TCzZgPn.jpeg')",
    backgroundSize: "cover",
    backgroundPosition: "center center",
    backgroundAttachment: "fixed",
  },
  sidebar: {
    width: "74px",
    background: "rgba(0, 0, 0, 0.88)",
    borderRight: `1px solid ${colors.brand}33`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "18px 0",
    gap: "24px",
    zIndex: 100,
    backdropFilter: "blur(10px)",
    position: "fixed",
    height: "100vh",
  },
  navBtn: {
    background: "none",
    border: "none",
    color: "#444",
    cursor: "pointer",
    fontSize: "28px",
    transition: "0.2s ease",
    outline: "none",
  },
  mainContent: {
    flex: 1,
    marginLeft: "74px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    zIndex: 2,
    width: "calc(100% - 74px)",
  },
  container: {
    maxWidth: "980px",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  statusBox: {
    width: "100%",
    background: colors.surface,
    padding: "24px",
    border: `1px solid ${colors.border}`,
    boxShadow: "0 10px 50px rgba(0,0,0,0.9)",
    margin: "0 auto",
    backdropFilter: "blur(5px)",
    borderRadius: "16px",
  },
  sectionTitle: {
    color: colors.brand,
    borderBottom: `1px solid ${colors.brand}33`,
    paddingBottom: "10px",
    margin: "0 0 20px 0",
    letterSpacing: "2px",
    fontSize: "18px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
    marginBottom: "20px",
    borderBottom: `1px solid ${colors.border}`,
    paddingBottom: "15px",
    flexWrap: "wrap",
  },
  dataBlock: {
    flex: 1,
    minWidth: "140px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "5px",
  },
  btnStep: {
    background: "none",
    border: "1px solid #333",
    color: "#fff",
    cursor: "pointer",
    padding: "4px 8px",
    fontSize: "12px",
    fontFamily: "inherit",
    borderRadius: "6px",
  },
  inputField: {
    background: "none",
    border: "none",
    color: colors.brand,
    fontFamily: "inherit",
    fontSize: "20px",
    fontWeight: "bold",
    width: "50px",
    textAlign: "center",
    outline: "none",
  },
  inputSmall: {
    background: "none",
    border: "none",
    color: "#d5d5d5",
    fontFamily: "inherit",
    fontSize: "12px",
    width: "42px",
    textAlign: "center",
    borderBottom: "1px dashed #333",
    outline: "none",
  },
  attrLabel: { color: "#666", fontSize: "11px", textTransform: "uppercase" },
  attrValue: {
    color: colors.brand,
    fontSize: "26px",
    fontWeight: "bold",
    textShadow: colors.glow,
  },
  mandalaContainer: {
    position: "relative",
    width: "520px",
    height: "520px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto",
    boxShadow: "0 20px 60px rgba(0,0,0,0.9)",
    borderRadius: "50%",
    maxWidth: "100%",
  },
  centralSymbol: {
    position: "absolute",
    width: "530px",
    height: "520px",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    mixBlendMode: "screen",
    maxWidth: "100%",
  },
  attributeNode: {
    position: "absolute",
    width: "76px",
    height: "76px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(5, 5, 7, 0.98)",
    borderRadius: "50%",
    border: `1px solid ${colors.border}`,
    zIndex: 10,
    cursor: "pointer",
    boxShadow: "0 0 15px rgba(0,0,0,0.8)",
  },
  habCard: {
    background: "rgba(0, 0, 0, 0.4)",
    padding: "15px",
    marginBottom: "10px",
    borderLeft: `3px solid ${colors.brand}`,
    borderRadius: "0 8px 8px 0",
  },
  tabGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "14px",
  },
  summaryCard: {
    background: "rgba(0,0,0,0.42)",
    border: `1px solid ${colors.border}`,
    borderRadius: "12px",
    padding: "14px",
  },
};

function StatusControl({ label, current, max, setCurrent, color }) {
  const visualPercentage = max <= 0 ? 0 : Math.min((current / max) * 100, 100);
  const updateCur = (val) => setCurrent((prev) => Math.max(0, prev + val)); // 👈 Agora não barra mais no limite máximo!

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        color,
        marginBottom: "15px",
      }}
    >
      <div
        style={{ width: "130px", fontSize: "11px", textTransform: "uppercase" }}
      >
        {label}
      </div>
      <button style={styles.btnStep} onClick={() => updateCur(-5)}>
        {"<<"}
      </button>
      <button style={styles.btnStep} onClick={() => updateCur(-1)}>
        {"<"}
      </button>
      <div
        style={{
          flex: 1,
          height: "14px",
          background: "#000",
          border: "1px solid #222",
          position: "relative",
          overflow: "hidden",
          borderRadius: "6px",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${visualPercentage}%`,
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}`,
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <button style={styles.btnStep} onClick={() => updateCur(1)}>
        {">"}
      </button>
      <button style={styles.btnStep} onClick={() => updateCur(5)}>
        {">>"}
      </button>
      <div style={{ width: "110px", textAlign: "right", fontSize: "14px" }}>
        <span>{current}</span> <span style={{ color: "#444" }}>/</span>{" "}
        <span style={{ color: "#fff", fontWeight: "bold" }}>{max}</span>
      </div>
    </div>
  );
}

function TabGlyph({ tab, active }) {
  const stroke = active ? "#00e5ff" : "#3a3f46";
  const glow = active ? "drop-shadow(0 0 6px rgba(0,229,255,0.55))" : "none";
  const common = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: { filter: glow, transition: "all .2s ease" },
  };

  if (tab === "status") {
    return (
      <svg {...common}>
        <polygon points="12 2.5 21.5 12 12 21.5 2.5 12 12 2.5" />
        <line x1="12" y1="7.5" x2="12" y2="16.5" />
        <line x1="7.5" y1="12" x2="16.5" y2="12" />
      </svg>
    );
  }
  if (tab === "classe") {
    return (
      <svg {...common}>
        <path d="M12 3.5 20 8v8l-8 4.5L4 16V8L12 3.5Z" />
        <path d="M8.5 10.5h7M8.5 13.5h7" />
      </svg>
    );
  }
  if (tab === "pericias") {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="6" height="6" />
        <rect x="14" y="4" width="6" height="6" />
        <rect x="4" y="14" width="6" height="6" />
        <rect x="14" y="14" width="6" height="6" />
      </svg>
    );
  }
  if (tab === "rituais") {
    return (
      <svg {...common}>
        <path d="M12 2.8v18.4M2.8 12h18.4" />
        <path d="m5.1 5.1 13.8 13.8M18.9 5.1 5.1 18.9" />
      </svg>
    );
  }
  if (tab === "inventario") {
    return (
      <svg {...common}>
        <rect x="5" y="7" width="14" height="14" rx="2.5" />
        <path d="M9 7V5.8A2.2 2.2 0 0 1 11.2 3.6h1.6A2.2 2.2 0 0 1 15 5.8V7" />
        <line x1="9" y1="12.5" x2="15" y2="12.5" />
      </svg>
    );
  }
  if (tab === "bestiario") {
    return (
      <svg {...common}>
        <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z" />
        <path d="M8 8h7M8 12h8M8 16h5" />
        <path d="M18 7h1.5A1.5 1.5 0 0 1 21 8.5V20" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M4 6h8l-2 4H2l2-4Zm8 8h8l-2 4h-8l2-4Z" />
      <path d="M9 10 7 14M17 10l2-4" />
    </svg>
  );
}

function AppContent() {
  const { signOut, role, user } = useAuth();
  const normalizedRole = normalizeRole(role);
  const isAdmin = normalizedRole === "admin";
  const isDM = canManageTable(normalizedRole);
  const storageKey = useMemo(() => `asa-sheet-v2:${user.id}`, [user.id]);
  const bestiaryStorageKey = useMemo(() => `asa-bestiary-v1:${user.id}`, [user.id]);

  // ==========================================
  // 1. TODOS OS ESTADOS (useState) PRIMEIRO!
  // ==========================================
  const [nex, setNex] = useState(5);
  const [deslocamento, setDeslocamento] = useState(9);
  const [defArmadura, setDefArmadura] = useState(0);
  const [defOutros, setDefOutros] = useState(0);
  const [origin, setOrigin] = useState("Acadêmico");
  const [originLocked, setOriginLocked] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [setupComplete, setSetupComplete] = useState(false);

  const [attrs, setAttrs] = useState({
    FOR: 1,
    AGI: 2,
    INT: 2,
    VIG: 2,
    PRE: 2,
  });

  const [pvAtual, setPvAtual] = useState(20);
  const [peAtual, setPeAtual] = useState(4);
  const [sanAtual, setSanAtual] = useState(12);

  const [classe, setClasse] = useState("Combatente");
  const [trilha, setTrilha] = useState(rulesByClass.Combatente.defaultTrilha);
  const [classSkillChoices, setClassSkillChoices] = useState(["", ""]);
  const [skillStates, setSkillStates] = useState(createDefaultSkillState);

  const [selectedPowers, setSelectedPowers] = useState([]);
  const [selectedParanormalPowers, setSelectedParanormalPowers] = useState([]);
  const [nexPopup, setNexPopup] = useState(null);

  const [rodadaAtual, setRodadaAtual] = useState(1);
  const [combatLogs, setCombatLogs] = useState([]);
  const [aliadosCampanha, setAliadosCampanha] = useState([]);
  const [combatParticipants, setCombatParticipants] = useState([]);
  const [turnOrder, setTurnOrder] = useState([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [turnDoneBy, setTurnDoneBy] = useState([]);
  const [selectedOrderDraft, setSelectedOrderDraft] = useState([]);
  const [npcNameInput, setNpcNameInput] = useState("");
  const [customBestiary, setCustomBestiary] = useState([]);
  const [customBestiaryReady, setCustomBestiaryReady] = useState(false);
  const [monsterDraft, setMonsterDraft] = useState(emptyMonsterDraft);
  const [selectedBestiaryId, setSelectedBestiaryId] = useState(asaBestiary[0]?.id || "");
  const [selectedMission, setSelectedMission] = useState("");
  const [missions, setMissions] = useState([]);
  const [remoteCharactersReady, setRemoteCharactersReady] = useState(false);
  const [playerCharacters, setPlayerCharacters] = useState([
    { id: `char-${Date.now()}`, nome: "" },
  ]);
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [preMissionReady, setPreMissionReady] = useState(false);
  const [characterSheets, setCharacterSheets] = useState({});
  const [adminProfiles, setAdminProfiles] = useState([]);
  const [adminCharacters, setAdminCharacters] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);

  const [rituaisSelecionados, setRituaisSelecionados] = useState([]);
  const [alvosRituais, setAlvosRituais] = useState({});
  const [versoesRituais, setVersoesRituais] = useState({});
  const [isRitualModalOpen, setIsRitualModalOpen] = useState(false);
  const [filtroElemento, setFiltroElemento] = useState("Todos");
  const [filtroCirculo, setFiltroCirculo] = useState("Todos");

  const [nomePersonagem, setNomePersonagem] = useState("");
  const [efeitoRitual, setEfeitoRitual] = useState(null);

  const [prestigio, setPrestigio] = useState(0);
  const [inventario, setInventario] = useState([]);

  const [itemBaseSelecionado, setItemBaseSelecionado] = useState(null);
  const [modsSelecionadas, setModsSelecionadas] = useState([]);
  const [maldicoesSelecionadas, setMaldicoesSelecionadas] = useState([]);
  const [infoModal, setInfoModal] = useState(null);

  function openInfoModal(kind, keys, startIndex = 0) {
    setInfoModal({
      kind,
      keys,
      index: startIndex,
    });
  }

  function getInfoEntry(modal) {
    if (!modal || !modal.keys?.length) return null;
    const key = modal.keys[modal.index];
    if (modal.kind === "mod") {
      return {
        title: `Modificação: ${key}`,
        text: MOD_FULL_DESC[key] || MOD_EFFECTS[key] || key,
      };
    }
    return {
      title: `Maldição: ${key}`,
      text: CURSE_FULL_DESC[key] || CURSE_EFFECTS[key] || key,
    };
  }

  function restartCharacterSetup() {
    if (
      !window.confirm(
        "Recomeçar seleção inicial? Origem e Classe serão desbloqueadas."
      )
    ) {
      return;
    }
    setSetupComplete(false);
    setSetupStep(1);
    setOriginLocked(false);
  }
  const itemDescRef = useRef(null);

  const [expandedDesc, setExpandedDesc] = useState({});
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );

  const [activeTab, setActiveTab] = useState("status");
  const [editingAttr, setEditingAttr] = useState(null);
  const [attrError, setAttrError] = useState("");
  const [skillsError, setSkillsError] = useState("");
  const [profileError, setProfileError] = useState("");

  const errorTimerRef = useRef(null);
  const skillsTimerRef = useRef(null);
  const profileTimerRef = useRef(null);
  const prevNexRef = useRef(5);
  const isInitialMount = useRef(true);
  const isSwitchingCharacterRef = useRef(false);
  const prevCharacterIdRef = useRef("");
  const isMobile = viewportWidth <= 900;
  const isSmallMobile = viewportWidth <= 520;
  const bestiaryEntries = useMemo(
    () => [...asaBestiary, ...customBestiary],
    [customBestiary]
  );
  const selectedBestiary = useMemo(
    () =>
      bestiaryEntries.find((monster) => monster.id === selectedBestiaryId) ||
      bestiaryEntries[0],
    [bestiaryEntries, selectedBestiaryId]
  );
  const lastCombatResetAt = useMemo(() => {
    const resets = parseFlowEvents(combatLogs).filter((event) => event?.event === "RESET");
    return resets.length
      ? Number(resets[resets.length - 1].logCreatedAt || resets[resets.length - 1].at || 0)
      : 0;
  }, [combatLogs]);
  const visibleCombatLogs = useMemo(() => {
    return combatLogs.filter((log) => {
      if (typeof log?.acao === "string" && log.acao.startsWith("[FLOW]")) return false;
      if (!lastCombatResetAt) return true;
      const createdAt = log?.created_at ? new Date(log.created_at).getTime() : 0;
      return createdAt >= lastCombatResetAt;
    });
  }, [combatLogs, lastCombatResetAt]);
  const alreadyJoinedCombat = useMemo(
    () => combatParticipants.some((p) => p.userId === user.id),
    [combatParticipants, user.id]
  );

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!user) return;
    loadRemoteCampaignData();
  }, [user]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(bestiaryStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setCustomBestiary(parsed);
      }
    } catch {
      setCustomBestiary([]);
    } finally {
      setCustomBestiaryReady(true);
    }
  }, [bestiaryStorageKey]);

  useEffect(() => {
    if (!customBestiaryReady) return;
    try {
      localStorage.setItem(bestiaryStorageKey, JSON.stringify(customBestiary));
    } catch {
      // Se o navegador bloquear armazenamento local, o bestiario customizado fica so nesta sessao.
    }
  }, [bestiaryStorageKey, customBestiary, customBestiaryReady]);

  useEffect(() => {
    if (activeTab === "admin") loadAdminPanelData();
  }, [activeTab, isDM]);

  function getActiveCharacterName() {
    const selected = playerCharacters.find((c) => c.id === selectedCharacterId);
    if (selected?.nome?.trim()) return selected.nome.trim();
    if (nomePersonagem?.trim()) return nomePersonagem.trim();
    return user.email.split("@")[0];
  }

  function createInitialCharacterSnapshot(characterName = "") {
    return {
      nomePersonagem: characterName,
      nex: 5,
      deslocamento: 9,
      defArmadura: 0,
      defOutros: 0,
      origin: "Acadêmico",
      originLocked: false,
      setupComplete: false,
      attrs: {
        FOR: 1,
        AGI: 2,
        INT: 2,
        VIG: 2,
        PRE: 2,
      },
      pvAtual: 20,
      peAtual: 4,
      sanAtual: 12,
      classe: "Combatente",
      trilha: rulesByClass.Combatente.defaultTrilha,
      classSkillChoices: ["", ""],
      skillStates: createDefaultSkillState(),
      selectedPowers: [],
      selectedParanormalPowers: [],
      rituaisSelecionados: [],
      prestigio: 0,
      inventario: [],
    };
  }

  function buildCharacterSnapshot() {
    return {
      nomePersonagem,
      nex,
      deslocamento,
      defArmadura,
      defOutros,
      origin,
      originLocked,
      setupComplete,
      attrs,
      pvAtual,
      peAtual,
      sanAtual,
      classe,
      trilha,
      classSkillChoices,
      skillStates,
      selectedPowers,
      selectedParanormalPowers,
      rituaisSelecionados,
      prestigio,
      inventario,
    };
  }

  function applyCharacterSnapshot(data) {
    if (!data) return;
    if (data.nomePersonagem) setNomePersonagem(data.nomePersonagem);
    if (data.nex) {
      prevNexRef.current = data.nex;
      setNex(data.nex);
    }
    if (typeof data.deslocamento === "number") setDeslocamento(data.deslocamento);
    if (typeof data.defArmadura === "number") setDefArmadura(data.defArmadura);
    if (typeof data.defOutros === "number") setDefOutros(data.defOutros);
    if (data.origin) setOrigin(data.origin);
    if (typeof data.originLocked === "boolean") setOriginLocked(data.originLocked);
    if (typeof data.setupComplete === "boolean") setSetupComplete(data.setupComplete);
    if (data.attrs) setAttrs(data.attrs);
    if (typeof data.pvAtual === "number") setPvAtual(data.pvAtual);
    if (typeof data.peAtual === "number") setPeAtual(data.peAtual);
    if (typeof data.sanAtual === "number") setSanAtual(data.sanAtual);
    if (data.classe) setClasse(data.classe);
    if (data.trilha) setTrilha(data.trilha);
    if (Array.isArray(data.classSkillChoices)) setClassSkillChoices(data.classSkillChoices);
    if (data.skillStates) setSkillStates({ ...createDefaultSkillState(), ...data.skillStates });
    if (Array.isArray(data.selectedPowers)) setSelectedPowers(data.selectedPowers);
    if (Array.isArray(data.selectedParanormalPowers))
      setSelectedParanormalPowers(data.selectedParanormalPowers);
    if (Array.isArray(data.rituaisSelecionados)) setRituaisSelecionados(data.rituaisSelecionados);
    if (typeof data.prestigio === "number") setPrestigio(data.prestigio);
    if (Array.isArray(data.inventario)) setInventario(data.inventario);
  }

  function resetCharacterDraftDefaults(characterName = "") {
    prevNexRef.current = 5;
    setNomePersonagem(characterName);
    setNex(5);
    setDeslocamento(9);
    setDefArmadura(0);
    setDefOutros(0);
    setOrigin("Acadêmico");
    setOriginLocked(false);
    setSetupStep(1);
    setSetupComplete(false);
    setAttrs({
      FOR: 1,
      AGI: 2,
      INT: 2,
      VIG: 2,
      PRE: 2,
    });
    setPvAtual(20);
    setPeAtual(4);
    setSanAtual(12);
    setClasse("Combatente");
    setTrilha(rulesByClass.Combatente.defaultTrilha);
    setClassSkillChoices(["", ""]);
    setSkillStates(createDefaultSkillState());
    setSelectedPowers([]);
    setSelectedParanormalPowers([]);
    setRituaisSelecionados([]);
    setAlvosRituais({});
    setVersoesRituais({});
    setPrestigio(0);
    setInventario([]);
  }

  async function createRemoteCharacter(characterName, missionName = selectedMission, initialSnapshot = null) {
    const cleanName = characterName?.trim();
    if (!cleanName) return null;
    const mission = missions.find((item) => item.name === missionName);
    const { data, error } = await supabase
      .from("characters")
      .insert([
        {
          owner_id: user.id,
          mission_id: mission?.id || null,
          name: cleanName,
          sheet_json: initialSnapshot || createInitialCharacterSnapshot(cleanName),
        },
      ])
      .select("id, name, mission_id, sheet_json, owner_id")
      .single();

    if (error) {
      console.warn("Falha ao criar personagem no Supabase:", error.message);
      return null;
    }

    setPlayerCharacters((prev) => [
      ...prev.filter((item) => item.id !== data.id),
      { id: data.id, nome: data.name, missionId: data.mission_id, remote: true },
    ]);
    setCharacterSheets((prev) => ({ ...prev, [data.id]: data.sheet_json || {} }));
    return data;
  }

  async function persistSelectedCharacterSheet(snapshot = buildCharacterSnapshot()) {
    if (!selectedCharacterId || !isUuid(selectedCharacterId)) return;
    const { error } = await supabase
      .from("characters")
      .update({
        name: snapshot.nomePersonagem || getActiveCharacterName(),
        sheet_json: snapshot,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedCharacterId);

    if (error) console.warn("Falha ao salvar personagem:", error.message);
  }

  async function loadRemoteCampaignData() {
    const { data: missionRows, error: missionError } = await supabase
      .from("missions")
      .select("id, name, description")
      .order("created_at", { ascending: true });

    if (!missionError && missionRows?.length) {
      setMissions(missionRows);
      setSelectedMission((prev) => prev || missionRows[0].name);
    } else {
      setMissions(MISSIONS_CATALOG.map((name) => ({ id: name, name })));
    }

    const { data: characterRows, error: characterError } = await supabase
      .from("characters")
      .select("id, name, mission_id, sheet_json, owner_id")
      .order("updated_at", { ascending: false });

    if (!characterError && Array.isArray(characterRows)) {
      const nextCharacters = characterRows.map((item) => ({
        id: item.id,
        nome: item.name,
        missionId: item.mission_id,
        remote: true,
      }));
      const nextSheets = {};
      characterRows.forEach((item) => {
        nextSheets[item.id] = item.sheet_json || {};
      });

      if (nextCharacters.length > 0) {
        setPlayerCharacters(nextCharacters);
        setCharacterSheets(nextSheets);
        setSelectedCharacterId((prev) => prev || nextCharacters[0].id);
      }
      setRemoteCharactersReady(true);
    } else {
      setRemoteCharactersReady(true);
    }
  }

  async function loadAdminPanelData() {
    if (!isDM) return;
    setAdminLoading(true);
    const [{ data: profiles }, { data: characters }] = await Promise.all([
      supabase.from("profiles").select("id, email, role, nome_personagem").order("email"),
      supabase
        .from("characters")
        .select("id, owner_id, name, mission_id, sheet_json, updated_at")
        .order("updated_at", { ascending: false }),
    ]);
    setAdminProfiles(profiles || []);
    setAdminCharacters(characters || []);
    setAdminLoading(false);
  }

  async function updateProfileRole(profileId, nextRole) {
    if (!isAdmin) {
      alert("Apenas administradores podem trocar roles.");
      return;
    }
    const { error } = await supabase.rpc("admin_update_profile_role", {
      target_profile_id: profileId,
      next_role: nextRole,
    });
    if (error) {
      alert(`Falha ao atualizar role: ${error.message}`);
      return;
    }
    loadAdminPanelData();
  }

  function parseFlowEvents(logs) {
    const events = [];
    for (const log of [...logs].reverse()) {
      if (!log?.acao || typeof log.acao !== "string") continue;
      if (!log.acao.startsWith("[FLOW]")) continue;
      const raw = log.acao.slice(6);
      try {
        const event = JSON.parse(raw);
        events.push({
          ...event,
          logCreatedAt: log.created_at ? new Date(log.created_at).getTime() : null,
        });
      } catch {
        // ignora evento inválido
      }
    }
    return events;
  }

  function computeCombatFlow(logs, currentRound) {
    const joinedByUser = new Map();
    let order = [];
    let done = [];
    let idx = 0;

    for (const event of parseFlowEvents(logs)) {
      if (event?.event === "RESET") {
        joinedByUser.clear();
        order = [];
        done = [];
        idx = 0;
      }
      if (event?.event === "JOIN" && event?.payload?.userId) {
        joinedByUser.set(event.payload.userId, {
          userId: event.payload.userId,
          nome: event.payload.nome || "Sem nome",
          kind: event.payload.kind || "player",
          monsterId: event.payload.monsterId || null,
          monster: event.payload.monster || null,
        });
      }
      if (event?.event === "SET_ORDER" && Array.isArray(event?.payload?.order)) {
        order = event.payload.order;
        idx = 0;
        done = [];
      }
      if (
        event?.event === "TURN_DONE" &&
        event?.payload?.userId &&
        Number(event?.payload?.round) === Number(currentRound)
      ) {
        if (!done.includes(event.payload.userId)) done.push(event.payload.userId);
        if (order[idx] === event.payload.userId) {
          idx = Math.min(idx + 1, Math.max(order.length - 1, 0));
        }
      }
      if (
        event?.event === "ROUND_RESET" &&
        Number(event?.payload?.round) === Number(currentRound)
      ) {
        idx = 0;
        done = [];
      }
    }

    const participants = [...joinedByUser.values()];
    return { participants, order, done, idx };
  }

  async function emitCombatFlow(event, payload) {
    await supabase.from("combat_log").insert([
      {
        personagem: "SISTEMA FLOW",
        acao: `[FLOW]${JSON.stringify({ event, payload, at: Date.now() })}`,
        rodada: rodadaAtual,
      },
    ]);
  }

  async function addMonsterToCombat(monster) {
    if (!isDM || !monster) return;
    const monsterId = `monster:${monster.id}:${Date.now()}`;
    await emitCombatFlow("JOIN", {
      userId: monsterId,
      nome: monster.name,
      kind: "monster",
      monsterId: monster.id,
      monster,
    });
    await supabase.from("combat_log").insert([
      {
        personagem: "SISTEMA A.S.A.",
        acao: `${monster.name} entrou no combate. VD ${monster.vd || "?"} | Defesa ${
          monster.defense || "?"
        } | PV ${monster.hp || "?"}.`,
        rodada: rodadaAtual,
      },
    ]);
  }

  async function sendMonsterActionToLog(participant, action) {
    if (!isDM || !participant || !action) return;
    await supabase.from("combat_log").insert([
      {
        personagem: participant.nome,
        acao: `${action.type ? `${action.type} - ` : ""}${action.name}: ${action.text}`,
        rodada: rodadaAtual,
      },
    ]);
  }

  function updateMonsterDraft(field, value) {
    setMonsterDraft((prev) => ({ ...prev, [field]: value }));
  }

  function saveCustomMonster() {
    if (!monsterDraft.name.trim()) {
      alert("Informe o nome do monstro.");
      return;
    }
    const monster = monsterFromDraft(monsterDraft);
    setCustomBestiary((prev) => [...prev, monster]);
    setSelectedBestiaryId(monster.id);
    setMonsterDraft(emptyMonsterDraft);
  }

  function removeCustomMonster(monsterId) {
    setCustomBestiary((prev) => prev.filter((monster) => monster.id !== monsterId));
    if (selectedBestiaryId === monsterId) setSelectedBestiaryId(asaBestiary[0]?.id || "");
  }

  async function resetCombatTable() {
    if (!isDM) return;
    if (!window.confirm("Resetar combate? A rodada, ordem, participantes e timeline visivel voltam ao zero.")) {
      return;
    }
    setRodadaAtual(1);
    setCombatParticipants([]);
    setTurnOrder([]);
    setTurnDoneBy([]);
    setTurnIndex(0);
    setSelectedOrderDraft([]);
    await supabase.from("combat_state").update({ rodada: 1 }).eq("id", 1);
    await emitCombatFlow("RESET", { round: 1 });
    await supabase.from("combat_log").insert([
      {
        personagem: "SISTEMA A.S.A.",
        acao: "Combate resetado pelo mestre. Mesa limpa e rodada reiniciada.",
        rodada: 1,
      },
    ]);
  }

  // ==========================================
  // 2. CÁLCULOS E DERIVAÇÕES (Agora é seguro usar as variáveis!)
  // ==========================================
  const patenteInfo = useMemo(() => {
    if (prestigio >= 200)
      return {
        nome: "Agente de Elite",
        credito: "Ilimitado",
        limite: { I: 3, II: 3, III: 3, IV: 2 },
      };
    if (prestigio >= 100)
      return {
        nome: "Oficial de Operações",
        credito: "Alto",
        limite: { I: 3, II: 3, III: 2, IV: 1 },
      };
    if (prestigio >= 50)
      return {
        nome: "Agente Especial",
        credito: "Médio",
        limite: { I: 3, II: 2, III: 1, IV: 0 },
      };
    if (prestigio >= 20)
      return {
        nome: "Operador",
        credito: "Médio",
        limite: { I: 3, II: 1, III: 0, IV: 0 },
      };
    return {
      nome: "Recruta",
      credito: "Baixo",
      limite: { I: 2, II: 0, III: 0, IV: 0 },
    };
  }, [prestigio]);

  const isTecnico =
    classe === "Especialista" && trilha === "Técnico" && nex >= 10;
  const forEfetiva = attrs.FOR + (isTecnico ? attrs.INT : 0);
  const cargaMaxima = forEfetiva <= 0 ? 2 : forEfetiva * 5;
  const cargaAtual = inventario.reduce(
    (acc, curr) => acc + Number(curr.espacos),
    0
  );
  const modsDisponiveis = getAllowedModsForItem(itemBaseSelecionado);
  const maldicoesDisponiveis = getAllowedCursesForItem(itemBaseSelecionado);
  const canUseCursedItems = [
    "Agente Especial",
    "Oficial de Operações",
    "Agente de Elite",
  ].includes(patenteInfo.nome);
  const previewItem = useMemo(() => {
    if (!itemBaseSelecionado) return null;
    const base = {
      nome: itemBaseSelecionado.nome,
      cat: itemBaseSelecionado.cat,
      espacos: itemBaseSelecionado.espacos,
      dano: itemBaseSelecionado.dano || "",
      critico: itemBaseSelecionado.critico || "",
      alcance: itemBaseSelecionado.alcance || "",
      tipo: itemBaseSelecionado.tipo || "",
      desc: itemBaseSelecionado.desc || "",
    };
    let next = base;
    if (modsSelecionadas.length > 0) {
      next = applyWeaponModifications(next, modsSelecionadas);
    }
    if (maldicoesSelecionadas.length > 0) {
      next = applyWeaponCurses(next, maldicoesSelecionadas);
    }
    return next;
  }, [itemBaseSelecionado, modsSelecionadas, maldicoesSelecionadas]);

  useEffect(() => {
    if (!itemDescRef.current) return;
    itemDescRef.current.style.height = "auto";
    itemDescRef.current.style.height = `${itemDescRef.current.scrollHeight}px`;
  }, [previewItem?.desc]);

  useEffect(() => {
    if (canUseCursedItems) return;
    if (maldicoesSelecionadas.length > 0) setMaldicoesSelecionadas([]);
  }, [canUseCursedItems, maldicoesSelecionadas]);

  useEffect(() => {
    if (!selectedCharacterId && playerCharacters.length > 0) {
      setSelectedCharacterId(playerCharacters[0].id);
    }
  }, [selectedCharacterId, playerCharacters]);

  useEffect(() => {
    if (!selectedMission || !selectedCharacterId) {
      setPreMissionReady(false);
    }
  }, [selectedMission, selectedCharacterId]);

  useEffect(() => {
    if (!selectedCharacterId || !preMissionReady || !remoteCharactersReady) return;
    if (isSwitchingCharacterRef.current) return;
    const snapshot = buildCharacterSnapshot();
    setCharacterSheets((prev) => ({
      ...prev,
      [selectedCharacterId]: snapshot,
    }));

    if (!isUuid(selectedCharacterId)) return;
    const timer = setTimeout(() => persistSelectedCharacterSheet(snapshot), 700);
    return () => clearTimeout(timer);
  }, [
    selectedCharacterId,
    preMissionReady,
    nomePersonagem,
    nex,
    deslocamento,
    defArmadura,
    defOutros,
    origin,
    originLocked,
    setupComplete,
    attrs,
    pvAtual,
    peAtual,
    sanAtual,
    classe,
    trilha,
    classSkillChoices,
    skillStates,
    selectedPowers,
    selectedParanormalPowers,
    rituaisSelecionados,
    prestigio,
    inventario,
    remoteCharactersReady,
  ]);

  useEffect(() => {
    if (!selectedCharacterId || !preMissionReady || !remoteCharactersReady) return;
    if (prevCharacterIdRef.current === selectedCharacterId) return;
    const snapshot = characterSheets[selectedCharacterId];
    prevCharacterIdRef.current = selectedCharacterId;
    if (!snapshot) return;
    isSwitchingCharacterRef.current = true;
    applyCharacterSnapshot(snapshot);
    setTimeout(() => {
      isSwitchingCharacterRef.current = false;
    }, 0);
  }, [selectedCharacterId, preMissionReady, remoteCharactersReady, characterSheets]);

  const categoriasUsadas = useMemo(() => {
    const contagem = { I: 0, II: 0, III: 0, IV: 0 };
    inventario.forEach((item) => {
      if (item.cat === 1) contagem.I++;
      if (item.cat === 2) contagem.II++;
      if (item.cat === 3) contagem.III++;
      if (item.cat >= 4) contagem.IV++;
    });
    return contagem;
  }, [inventario]);

  const limiteRituais = useMemo(() => {
    let total = 0;
    if (classe === "Ocultista") {
      total += 2 + Math.floor(nex / 5);
      if (trilha === "Graduado" && nex >= 10) {
        total += 1;
        if (nex >= 25) total += 1;
        if (nex >= 55) total += 1;
        if (nex >= 85) total += 1;
      }
      if (trilha === "Graduado" && nex >= 40) {
        total += attrs.INT;
        if (nex >= 55) total += 1;
        if (nex >= 85) total += 1;
      }
    }
    const aprenderRitualCount = selectedParanormalPowers.filter(
      (p) => p === "Aprender Ritual"
    ).length;
    total += aprenderRitualCount;
    return total;
  }, [classe, trilha, nex, attrs.INT, selectedParanormalPowers]);

  // ==========================================
  // 3. EFEITOS DO SUPABASE (Abaixo dessa linha fica tudo igual)
  // ==========================================

  useEffect(() => {
    if (!user) return;

    // Puxa o estado atual ao entrar
    const carregarMesa = async () => {
      const { data: st } = await supabase
        .from("combat_state")
        .select("rodada")
        .eq("id", 1)
        .single();
      if (st) setRodadaAtual(st.rodada);

      const { data: logs } = await supabase
        .from("combat_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(40);
      if (logs) setCombatLogs(logs);
    };
    carregarMesa();

    // Fica escutando qualquer pessoa atualizando o banco
    const stateSub = supabase
      .channel("state-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "combat_state" },
        (payload) => {
          setRodadaAtual(payload.new.rodada);
        }
      )
      .subscribe();

    const logSub = supabase
      .channel("log-inserts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "combat_log" },
        (payload) => {
          setCombatLogs((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(stateSub);
      supabase.removeChannel(logSub);
    };
  }, [user]);

  useEffect(() => {
    const flow = computeCombatFlow(combatLogs, rodadaAtual);
    setCombatParticipants(flow.participants);
    setTurnOrder(flow.order);
    setTurnDoneBy(flow.done);
    setTurnIndex(flow.idx);
  }, [combatLogs, rodadaAtual]);

  useEffect(() => {
    if (turnOrder.length > 0) {
      setSelectedOrderDraft(turnOrder);
      return;
    }
    setSelectedOrderDraft((prev) => {
      if (prev.length > 0) return prev;
      return combatParticipants.map((p) => p.userId);
    });
  }, [turnOrder, combatParticipants]);

  // Função exclusiva do Mestre
  const avancarRodada = async () => {
    if (!isDM) return;
    if (!turnOrder.length) {
      alert("Defina a ordem do turno antes de avançar rodada.");
      return;
    }
    const pendentes = turnOrder.filter((id) => !turnDoneBy.includes(id));
    if (pendentes.length > 0) {
      const nomesPendentes = pendentes
        .map((id) => combatParticipants.find((p) => p.userId === id)?.nome || id)
        .join(", ");
      alert(`Ainda faltam agir nesta rodada: ${nomesPendentes}`);
      return;
    }
    const prox = rodadaAtual + 1;
    setRodadaAtual(prox);
    await supabase.from("combat_state").update({ rodada: prox }).eq("id", 1);
    await emitCombatFlow("ROUND_RESET", { round: prox });
    await supabase.from("combat_log").insert([
      {
        personagem: "SISTEMA A.S.A.",
        acao: `A Rodada ${prox} começou!`,
        rodada: prox,
      },
    ]);
  };

  useEffect(() => {
    async function fetchProfiles() {
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome_personagem, email");

      if (!error && data) {
        const players = data
          .filter((p) => p.id !== user.id)
          .map((p) => ({
            id: p.id,
            nome: p.nome_personagem || p.email.split("@")[0],
          }));
        setAliadosCampanha(players);

        const myProfile = data.find((p) => p.id === user.id);
        if (myProfile?.nome_personagem) {
          setNomePersonagem(myProfile.nome_personagem);
          setPlayerCharacters((prev) => {
            if (prev.some((c) => c.nome === myProfile.nome_personagem)) return prev;
            return [
              ...prev,
              { id: `char-${Date.now()}-main`, nome: myProfile.nome_personagem },
            ];
          });
        }
      }
    }
    fetchProfiles();
  }, [user]);

  const handleSalvarNome = async () => {
    if (!user) return;
    const { error } = await supabase.rpc("update_my_profile_name", {
      next_name: nomePersonagem,
    });
    if (error) console.warn("Falha ao salvar nome do perfil:", error.message);
  };

  useEffect(() => {
    const oldNex = prevNexRef.current;
    if (nex > oldNex) {
      const unlocks = getUnlocksForNexRange(oldNex, nex, classe, trilha);
      if (unlocks.length > 0) setNexPopup({ from: oldNex, to: nex, unlocks });
    }
    prevNexRef.current = nex;
  }, [nex, classe, trilha]);

  const regra = rulesByClass[classe];
  const nexIndex = NEX_VALUES.indexOf(nex);
  const nivel = Math.max(1, Math.floor(nex / 5));
  const limitePE = nex === 99 ? 20 : Math.floor(nex / 5);
  const limitePERitual =
    classe === "Ocultista" && trilha === "Intuitivo" && nex >= 40
      ? limitePE + attrs.PRE
      : limitePE;
  const defesaTotal = 10 + attrs.AGI + defArmadura + defOutros;
  const mandalaSize = isSmallMobile ? 320 : isMobile ? 390 : 520;
  const nodeSize = isSmallMobile ? 58 : isMobile ? 66 : 76;
  const attrRadius = isSmallMobile ? 120 : isMobile ? 150 : 200;

  // 👇 NOVA MATEMÁTICA: LENDO OS PODERES PASSIVOS 👇
  const temSangueDeFerro = selectedParanormalPowers.includes("Sangue de Ferro");
  const temCascaGrossa =
    classe === "Combatente" && trilha === "Tropa de Choque" && nex >= 10;
  const temPotencialAprimorado = selectedParanormalPowers.includes(
    "Potencial Aprimorado"
  );

  const bonusPV =
    (temSangueDeFerro ? nivel * 2 : 0) + (temCascaGrossa ? nivel * 1 : 0);
  const bonusPE = temPotencialAprimorado ? nivel * 1 : 0;

  const maxPVCalculado =
    regra.pvBase +
    attrs.VIG +
    (nivel - 1) * (regra.pvNivel + attrs.VIG) +
    bonusPV;
  const maxPECalculado =
    regra.peBase +
    attrs.PRE +
    (nivel - 1) * (regra.peNivel + attrs.PRE) +
    bonusPE;
  // 👆 FIM DA NOVA MATEMÁTICA 👆

  const transcendCount = selectedPowers.filter(
    (power) => power === "Transcender"
  ).length;
  const maxSANCalculado =
    regra.sanBase +
    (nivel - 1) * regra.sanNivel -
    transcendCount * regra.sanNivel;

  let maxSingleAttr = 3;
  if (nex >= 50) maxSingleAttr = 5;
  else if (nex >= 20) maxSingleAttr = 4;

  let maxTotalPoints = 9;
  if (nex >= 20) maxTotalPoints += 1;
  if (nex >= 50) maxTotalPoints += 1;
  if (nex >= 80) maxTotalPoints += 1;
  if (nex >= 95) maxTotalPoints += 1;

  const currentTotalPoints = useMemo(
    () => Object.values(attrs).reduce((a, b) => a + b, 0),
    [attrs]
  );
  // 👇 NOVO: CÁLCULO DE LIMITE DE RITUAIS 👇
  const trainingCap =
    nex >= 70 ? "expert" : nex >= 35 ? "veterano" : "treinado";
  const trainingRank = { destreinado: 0, treinado: 1, veterano: 2, expert: 3 };

  const trilhasDisponiveis = Object.keys(trilhasData[classe]);

  const habilidadesBaseAtuais = classBaseAbilities[classe].filter(
    (h) => nex >= h.nex
  );
  const habilidadesTrilhaAtuais = trilhasData[classe][trilha].filter(
    (h) => nex >= h.nex
  );
  const habilidadesAtuais = [
    ...habilidadesBaseAtuais,
    ...habilidadesTrilhaAtuais.map((h) => ({ ...h, tipo: "trilha" })),
  ].sort((a, b) => a.nex - b.nex);
  const powerSlots = getPowerSlots(nex);
  const originSkills = originsData[origin] ?? [];
  const fixedClassSkills = classSkillChoices.filter(Boolean);
  const freeChoicesAllowed = regra.freeChoicesBase + attrs.INT;

  const manualChosenSkills = useMemo(() => {
    const autoSkills = new Set([...originSkills, ...fixedClassSkills]);
    return Object.entries(skillStates)
      .filter(([, val]) => val.treino !== "destreinado")
      .map(([name]) => name)
      .filter((name) => !autoSkills.has(name));
  }, [skillStates, originSkills, fixedClassSkills]);

  const totalChosenTrained = useMemo(() => {
    const names = new Set([
      ...originSkills,
      ...fixedClassSkills,
      ...manualChosenSkills,
    ]);
    return names.size;
  }, [originSkills, fixedClassSkills, manualChosenSkills]);

  const expectedTrainedCount = 2 + fixedClassSkills.length + freeChoicesAllowed;
  const freeChoicesUsed = manualChosenSkills.length;

  function flashAttrError(message) {
    setAttrError(message);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setAttrError(""), 4000);
  }
  function flashSkillsError(message) {
    setSkillsError(message);
    if (skillsTimerRef.current) clearTimeout(skillsTimerRef.current);
    skillsTimerRef.current = setTimeout(() => setSkillsError(""), 4000);
  }
  function flashProfileError(message) {
    setProfileError(message);
    if (profileTimerRef.current) clearTimeout(profileTimerRef.current);
    profileTimerRef.current = setTimeout(() => setProfileError(""), 4000);
  }

  function handleAttrChange(key, rawValue) {
    const parsed = rawValue === "" ? 0 : Number(rawValue);
    if (Number.isNaN(parsed) || parsed < 0) return;
    const updatedAttrs = { ...attrs, [key]: parsed };
    const newTotal = Object.values(updatedAttrs).reduce((a, b) => a + b, 0);
    const zeroCount = Object.values(updatedAttrs).filter((v) => v === 0).length;

    if (parsed > maxSingleAttr) {
      flashAttrError(
        `LIMITE ATINGIDO: o teto de atributo no NEX ${nex}% é ${maxSingleAttr}.`
      );
      return;
    }
    if (newTotal > maxTotalPoints) {
      flashAttrError(
        `CARGA EXCEDIDA: você só pode ter ${maxTotalPoints} pontos totais no NEX ${nex}%.`
      );
      return;
    }
    if (nex === 5 && zeroCount > 1) {
      flashAttrError(
        "Na criação, apenas um atributo pode ser reduzido para 0."
      );
      return;
    }

    setAttrError("");
    setAttrs(updatedAttrs);
  }

  function handleClasseChange(novaClasse) {
    setClasse(novaClasse);
    setTrilha(rulesByClass[novaClasse].defaultTrilha);
    setProfileError("");

    // 👇 Limpa os poderes antigos para não bugar a ficha 👇
    setSelectedPowers([]);
    setSelectedParanormalPowers([]);

    if (novaClasse === "Combatente") {
      setClassSkillChoices(["", ""]);
    } else if (novaClasse === "Ocultista") {
      setClassSkillChoices(["Ocultismo", "Vontade"]);
    } else {
      setClassSkillChoices([]);
    }
  }

  function isAutoTrained(skillName) {
    return (
      (originLocked && originSkills.includes(skillName)) ||
      fixedClassSkills.includes(skillName)
    );
  }

  function resetSkills() {
    const next = createDefaultSkillState();
    for (const skillName of originLocked ? originSkills : []) {
      next[skillName] = { ...next[skillName], treino: "treinado", outros: 0 };
    }
    for (const skillName of fixedClassSkills) {
      next[skillName] = { ...next[skillName], treino: "treinado", outros: 0 };
    }
    setSkillStates(next);
    setSkillsError("");
  }

  function lockOriginAndClassSkills() {
    const requiredChoices = regra.fixedChoices.length;
    if (!origin) {
      flashProfileError("Selecione uma origem antes de confirmar o arquétipo.");
      return;
    }
    if (
      requiredChoices > 0 &&
      classSkillChoices.filter(Boolean).length !== requiredChoices
    ) {
      flashProfileError(
        "Preencha todas as perícias obrigatórias da classe antes de confirmar."
      );
      return;
    }
    if (
      new Set(classSkillChoices.filter(Boolean)).size !==
      classSkillChoices.filter(Boolean).length
    ) {
      flashProfileError("As escolhas fixas da classe não podem se repetir.");
      return;
    }

    setOriginLocked(true);
    setProfileError("");

    setSkillStates((prev) => {
      const next = { ...prev };
      for (const skillName of originSkills) {
        next[skillName] = {
          ...next[skillName],
          treino:
            trainingRank[next[skillName]?.treino || "destreinado"] >
            trainingRank[trainingCap]
              ? trainingCap
              : next[skillName]?.treino === "destreinado"
              ? "treinado"
              : next[skillName]?.treino || "treinado",
        };
      }
      for (const skillName of fixedClassSkills) {
        next[skillName] = {
          ...next[skillName],
          treino:
            trainingRank[next[skillName]?.treino || "destreinado"] >
            trainingRank[trainingCap]
              ? trainingCap
              : next[skillName]?.treino === "destreinado"
              ? "treinado"
              : next[skillName]?.treino || "treinado",
        };
      }
      return next;
    });
  }

  function setSkillTraining(skillName, nextTraining) {
    const skill = skillsCatalog.find((item) => item.nome === skillName);
    if (!skill) return;
    if (trainingRank[nextTraining] > trainingRank[trainingCap]) {
      flashSkillsError(
        `No NEX ${nex}%, o grau máximo permitido é ${trainingCap}.`
      );
      return;
    }
    if (isAutoTrained(skillName) && nextTraining === "destreinado") {
      flashSkillsError(
        "Essa perícia está sendo treinada automaticamente por origem ou classe."
      );
      return;
    }

    const nextStates = {
      ...skillStates,
      [skillName]: { ...skillStates[skillName], treino: nextTraining },
    };
    const autoSkills = new Set([...originSkills, ...fixedClassSkills]);
    const manualCount = Object.entries(nextStates)
      .filter(([, val]) => val.treino !== "destreinado")
      .map(([name]) => name)
      .filter((name) => !autoSkills.has(name)).length;

    if (
      !autoSkills.has(skillName) &&
      nextTraining !== "destreinado" &&
      manualCount > freeChoicesAllowed
    ) {
      flashSkillsError(
        `Você excedeu as perícias livres da classe. Limite atual: ${freeChoicesAllowed}.`
      );
      return;
    }

    setSkillsError("");
    setSkillStates(nextStates);
  }

  function setSkillOtherBonus(skillName, value) {
    const parsed = value === "" ? 0 : Number(value);
    if (Number.isNaN(parsed)) return;
    setSkillStates((prev) => ({
      ...prev,
      [skillName]: { ...prev[skillName], outros: parsed },
    }));
  }

  function handleSelectPower(slotIndex, powerName) {
    const next = [...selectedPowers];
    next[slotIndex] = powerName;
    setSelectedPowers(next);
    if (powerName !== "Transcender") {
      const nextParanormal = [...selectedParanormalPowers];
      nextParanormal[slotIndex] = "";
      setSelectedParanormalPowers(nextParanormal);
    }
  }

  function handleSelectParanormalPower(slotIndex, powerName) {
    const next = [...selectedParanormalPowers];
    next[slotIndex] = powerName;
    setSelectedParanormalPowers(next);
  }

  useEffect(() => {
    if (!trilhasDisponiveis.includes(trilha)) {
      setTrilha(trilhasDisponiveis[0]);
    }
  }, [classe, trilha, trilhasDisponiveis]);

  useEffect(() => {
    setSkillStates((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const skill of skillsCatalog) {
        const current = prev[skill.nome]?.treino ?? "destreinado";
        if (trainingRank[current] > trainingRank[trainingCap]) {
          next[skill.nome] = { ...prev[skill.nome], treino: trainingCap };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [trainingCap]);

  useEffect(() => {
    setOriginLocked(false);
    setProfileError("");
  }, [origin, classe, classSkillChoices.join("|")]);

  // 💾 SAVE NO LOCALSTORAGE
  useEffect(() => {
    // 👇 Impede que o React salve a ficha zerada logo ao abrir a página!
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const payload = {
      ownerUserId: user.id,
      ownerEmail: user.email || "",
      nex,
      deslocamento,
      defArmadura,
      defOutros,
      origin,
      attrs,
      pvAtual,
      peAtual,
      sanAtual,
      classe,
      trilha,
      classSkillChoices,
      skillStates,
      selectedPowers,
      selectedParanormalPowers,
      rituaisSelecionados,
      prestigio,
      inventario,
      originLocked,
      setupComplete,
      selectedMission,
      playerCharacters,
      selectedCharacterId,
      preMissionReady,
      characterSheets,
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [
    nex,
    deslocamento,
    defArmadura,
    defOutros,
    origin,
    attrs,
    pvAtual,
    peAtual,
    sanAtual,
    classe,
    trilha,
    classSkillChoices,
    skillStates,
    selectedPowers,
    selectedParanormalPowers,
    rituaisSelecionados,
    prestigio,
    inventario,
    originLocked,
    setupComplete,
    selectedMission,
    playerCharacters,
    selectedCharacterId,
    preMissionReady,
    characterSheets,
    storageKey,
    user.id,
    user.email,
  ]);
  // 💾 LOAD DO LOCALSTORAGE
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      if (data?.ownerUserId && data.ownerUserId !== user.id) {
        localStorage.removeItem(storageKey);
        return;
      }
      if (data.nex) {
        // Evita abrir popup de "up de NEX" ao apenas carregar a ficha salva.
        prevNexRef.current = data.nex;
        setNex(data.nex);
      }
      if (typeof data.deslocamento === "number")
        setDeslocamento(data.deslocamento);
      if (typeof data.defArmadura === "number")
        setDefArmadura(data.defArmadura);
      if (typeof data.defOutros === "number") setDefOutros(data.defOutros);
      if (data.origin) setOrigin(data.origin);
      if (data.attrs) setAttrs(data.attrs);
      if (typeof data.pvAtual === "number") setPvAtual(data.pvAtual);
      if (typeof data.peAtual === "number") setPeAtual(data.peAtual);
      if (typeof data.sanAtual === "number") setSanAtual(data.sanAtual);
      if (data.classe) setClasse(data.classe);
      if (data.trilha) setTrilha(data.trilha);
      if (Array.isArray(data.classSkillChoices))
        setClassSkillChoices(data.classSkillChoices);
      if (typeof data.originLocked === "boolean")
        setOriginLocked(data.originLocked);
      if (typeof data.setupComplete === "boolean") {
        setSetupComplete(data.setupComplete);
      } else if (typeof data.originLocked === "boolean") {
        setSetupComplete(data.originLocked);
      }
      if (data.skillStates)
        setSkillStates({ ...createDefaultSkillState(), ...data.skillStates });
      if (Array.isArray(data.selectedPowers))
        setSelectedPowers(data.selectedPowers);
      if (Array.isArray(data.selectedParanormalPowers))
        setSelectedParanormalPowers(data.selectedParanormalPowers);
      if (Array.isArray(data.rituaisSelecionados))
        setRituaisSelecionados(data.rituaisSelecionados);

      // 👈 CARREGANDO INVENTÁRIO
      if (typeof data.prestigio === "number") setPrestigio(data.prestigio);
      if (Array.isArray(data.inventario)) setInventario(data.inventario);
      if (typeof data.selectedMission === "string")
        setSelectedMission(data.selectedMission);
      if (Array.isArray(data.playerCharacters) && data.playerCharacters.length) {
        setPlayerCharacters(data.playerCharacters);
      }
      if (typeof data.selectedCharacterId === "string")
        setSelectedCharacterId(data.selectedCharacterId);
      if (typeof data.preMissionReady === "boolean")
        setPreMissionReady(data.preMissionReady);
      if (data.characterSheets && typeof data.characterSheets === "object") {
        setCharacterSheets(data.characterSheets);
      }
    } catch {
      /* erro silencioso */
    }
  }, [storageKey, user.id]);

  if (!preMissionReady) {
    const selectedChar = playerCharacters.find((c) => c.id === selectedCharacterId);
    return (
      <div style={styles.body}>
        <button
          onClick={signOut}
          style={{
            position: "fixed",
            top: isMobile ? "10px" : "20px",
            right: isMobile ? "10px" : "20px",
            zIndex: 9999,
            background: "#ff1744",
            color: "#fff",
            border: "none",
            padding: isMobile ? "8px 12px" : "10px 14px",
            borderRadius: "8px",
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: "bold",
            fontSize: isMobile ? "12px" : "14px",
            boxShadow: "0 0 10px rgba(255, 23, 68, 0.4)",
          }}
        >
          Sair
        </button>
        <div
          style={{
            minHeight: "100vh",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: isMobile ? "72px 12px 20px" : "24px",
            boxSizing: "border-box",
          }}
        >
          <div style={{ ...styles.container, maxWidth: "760px", width: "100%" }}>
            <div style={styles.statusBox}>
            <h2 style={styles.sectionTitle}>PRÉ-MISSÃO</h2>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ ...styles.attrLabel, marginBottom: "8px" }}>MISSÃO</div>
              <select
                value={selectedMission}
                onChange={(e) => setSelectedMission(e.target.value)}
                style={styles.selectField}
              >
                <option value="">Selecione a missão</option>
                {(missions.length ? missions : MISSIONS_CATALOG.map((name) => ({ id: name, name }))).map((mission) => (
                  <option key={mission.id || mission.name} value={mission.name || mission}>
                    {mission.name || mission}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ ...styles.attrLabel, marginBottom: "8px" }}>
                PERSONAGENS DO AGENTE
              </div>
              <div style={{ display: "grid", gap: "8px" }}>
                {playerCharacters.map((character) => (
                  <div key={character.id} style={{ display: "flex", gap: "8px" }}>
                    <input
                      value={character.nome}
                      onChange={(e) =>
                        setPlayerCharacters((prev) =>
                          prev.map((c) =>
                            c.id === character.id ? { ...c, nome: e.target.value } : c
                          )
                        )
                      }
                      placeholder="Nome do personagem"
                      style={{ ...styles.selectField, flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedCharacterId(character.id)}
                      style={{
                        ...styles.btnStep,
                        borderColor:
                          selectedCharacterId === character.id ? colors.brand : "#333",
                        color: selectedCharacterId === character.id ? colors.brand : "#888",
                        minWidth: "92px",
                      }}
                    >
                      Selecionar
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (playerCharacters.length <= 1) {
                          alert("Você precisa manter ao menos 1 personagem.");
                          return;
                        }
                        const canDelete = window.confirm(
                          `Excluir o personagem \"${character.nome || "sem nome"}\"?`
                        );
                        if (!canDelete) return;
                        if (isUuid(character.id)) {
                          const { error } = await supabase
                            .from("characters")
                            .delete()
                            .eq("id", character.id);
                          if (error) {
                            alert(`Falha ao excluir personagem: ${error.message}`);
                            return;
                          }
                        }
                        setPlayerCharacters((prev) =>
                          prev.filter((c) => c.id !== character.id)
                        );
                        setCharacterSheets((prev) => {
                          const next = { ...prev };
                          delete next[character.id];
                          return next;
                        });
                        if (selectedCharacterId === character.id) {
                          const fallback = playerCharacters.find(
                            (c) => c.id !== character.id
                          );
                          setSelectedCharacterId(fallback?.id || "");
                        }
                      }}
                      style={{
                        ...styles.btnStep,
                        borderColor: colors.pv,
                        color: colors.pv,
                        minWidth: "64px",
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={async () => {
                    const requestedName = window.prompt("Nome do personagem:")?.trim();
                    if (!requestedName) {
                      alert("Você precisa informar um nome.");
                      return;
                    }
                    const created = await createRemoteCharacter(requestedName, selectedMission, createInitialCharacterSnapshot(requestedName));
                    if (created) {
                      setSelectedCharacterId(created.id);
                      return;
                    }
                    setPlayerCharacters((prev) => [
                      ...prev,
                      { id: `char-${Date.now()}-${prev.length}`, nome: requestedName },
                    ]);
                  }}
                  style={{ ...styles.btnStep }}
                >
                  + Adicionar personagem
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const requestedName = window
                      .prompt("Nome do novo personagem:")
                      ?.trim();
                    if (!requestedName) {
                      alert("Você precisa informar um nome para criar personagem.");
                      return;
                    }
                    isSwitchingCharacterRef.current = true;
                    resetCharacterDraftDefaults(requestedName);
                    const freshSnapshot = createInitialCharacterSnapshot(requestedName);
                    const created = await createRemoteCharacter(requestedName, selectedMission, freshSnapshot);
                    const newId = created?.id || `char-${Date.now()}-new`;
                    if (!created) {
                      setPlayerCharacters((prev) => [
                        ...prev,
                        { id: newId, nome: requestedName },
                      ]);
                    }
                    setSelectedCharacterId(newId);
                    prevCharacterIdRef.current = newId;
                    setCharacterSheets((prev) => ({
                      ...prev,
                      [newId]: freshSnapshot,
                    }));
                    setTimeout(() => {
                      isSwitchingCharacterRef.current = false;
                    }, 0);
                    setPreMissionReady(true);
                  }}
                  style={{ ...styles.btnStep, borderColor: colors.brand, color: colors.brand }}
                >
                  Novo personagem (ir criar ficha)
                </button>
              </div>
            </div>
            <button
              onClick={async () => {
                if (!selectedMission) {
                  alert("Escolha a missão para continuar.");
                  return;
                }
                if (!selectedChar?.nome?.trim()) {
                  alert("Selecione um personagem com nome.");
                  return;
                }
                const chosenName = selectedChar.nome.trim();
                let nextCharacterId = selectedCharacterId;
                if (!isUuid(nextCharacterId)) {
                  const created = await createRemoteCharacter(chosenName, selectedMission, createInitialCharacterSnapshot(chosenName));
                  if (created?.id) {
                    nextCharacterId = created.id;
                    setSelectedCharacterId(created.id);
                  }
                }
                setNomePersonagem(chosenName);
                const snapshot = characterSheets[nextCharacterId];
                if (snapshot) {
                  isSwitchingCharacterRef.current = true;
                  applyCharacterSnapshot(snapshot);
                  setTimeout(() => {
                    isSwitchingCharacterRef.current = false;
                  }, 0);
                }
                await supabase
                  .from("profiles")
                  .update({ nome_personagem: chosenName })
                  .eq("id", user.id);
                setPreMissionReady(true);
              }}
              style={{
                ...styles.btnStep,
                width: "100%",
                marginTop: "8px",
                borderColor: colors.brand,
                color: colors.brand,
                fontWeight: "bold",
              }}
            >
              Confirmar missão e personagem
            </button>
          </div>
        </div>
        </div>
      </div>
    );
  }

  if (!setupComplete) {
    return (
      <div style={styles.body}>
        <button
          onClick={signOut}
          style={{
            position: "fixed",
            top: isMobile ? "10px" : "20px",
            right: isMobile ? "10px" : "20px",
            zIndex: 9999,
            background: "#ff1744",
            color: "#fff",
            border: "none",
            padding: isMobile ? "8px 12px" : "10px 14px",
            borderRadius: "8px",
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: "bold",
            fontSize: isMobile ? "12px" : "14px",
            boxShadow: "0 0 10px rgba(255, 23, 68, 0.4)",
          }}
        >
          Sair
        </button>
        <main
          style={{
            width: "100%",
            maxWidth: "900px",
            margin: "0 auto",
            padding: isMobile ? "72px 12px 20px" : "40px 20px",
          }}
        >
          <div style={{ ...styles.summaryCard, marginBottom: "14px" }}>
            <h2
              style={{
                margin: 0,
                color: colors.brand,
                letterSpacing: "3px",
                textShadow: colors.glow,
              }}
            >
              INICIALIZAÇÃO DE AGENTE
            </h2>
            <p style={{ color: "#9fb7c2", marginTop: "8px", marginBottom: 0 }}>
              Selecione Origem e Classe para iniciar a ficha.
            </p>
          </div>

          {setupStep === 1 && (
            <div style={styles.summaryCard}>
              <div style={{ ...styles.attrLabel, marginBottom: "10px" }}>
                ETAPA 1/4 · ORIGEM
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1.1fr 1fr",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignContent: "flex-start" }}>
                  {Object.keys(originsData).map((item) => (
                    <button
                      key={item}
                      onClick={() => setOrigin(item)}
                      style={{
                        ...styles.btnStep,
                        borderColor: origin === item ? colors.brand : "#333",
                        color: origin === item ? colors.brand : "#999",
                        background: origin === item ? `${colors.brand}11` : "#0b0b0f",
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div
                  style={{
                    border: "1px solid #2a2a2a",
                    borderRadius: "10px",
                    padding: "12px",
                    background: "rgba(0,0,0,0.2)",
                  }}
                >
                  <div style={{ color: colors.brand, fontSize: "12px", marginBottom: "8px" }}>
                    {origin}
                  </div>
                  <div style={{ color: "#b6c7d0", fontSize: "12px", lineHeight: 1.5 }}>
                    {originDescription[origin]}
                  </div>
                  <div style={{ marginTop: "10px", fontSize: "12px", color: "#ddd" }}>
                    <strong>Perícias treinadas:</strong>{" "}
                    {originsData[origin]?.length
                      ? originsData[origin].join(" • ")
                      : "Duas à escolha do mestre"}
                  </div>
                  <div style={{ marginTop: "8px", fontSize: "12px", color: "#ddd" }}>
                    <strong>Poder da origem:</strong> {originPowerName[origin]}
                  </div>
                  <div
                    style={{
                      marginTop: "6px",
                      fontSize: "12px",
                      color: "#cfd8dc",
                      lineHeight: 1.5,
                      whiteSpace: "pre-line",
                    }}
                  >
                    {originPowerDesc[origin]}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: "16px", textAlign: "right" }}>
                <button
                  onClick={() => setSetupStep(2)}
                  style={{ ...styles.btnStep, borderColor: colors.brand, color: colors.brand }}
                >
                  Próximo
                </button>
              </div>
            </div>
          )}

          {setupStep === 2 && (
            <div style={styles.summaryCard}>
              <div style={{ ...styles.attrLabel, marginBottom: "10px" }}>
                ETAPA 2/4 · CLASSE
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignContent: "flex-start" }}>
                  {["Combatente", "Especialista", "Ocultista"].map((c) => (
                    <button
                      key={c}
                      onClick={() => handleClasseChange(c)}
                      style={{
                        ...styles.btnStep,
                        borderColor: classe === c ? colors.brand : "#333",
                        color: classe === c ? colors.brand : "#999",
                        background: classe === c ? `${colors.brand}11` : "#0b0b0f",
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div
                  style={{
                    border: "1px solid #2a2a2a",
                    borderRadius: "10px",
                    padding: "12px",
                    background: "rgba(0,0,0,0.2)",
                    fontSize: "12px",
                    color: "#ddd",
                    lineHeight: 1.55,
                  }}
                >
                  <div style={{ color: colors.brand, marginBottom: "8px" }}>
                    {classe}
                  </div>
                  <div style={{ color: "#b6c7d0", marginBottom: "8px" }}>
                    {classInfo[classe]?.role}
                  </div>
                  <div
                    style={{
                      color: "#cfd8dc",
                      marginBottom: "8px",
                      lineHeight: 1.5,
                    }}
                  >
                    {classInfo[classe]?.full}
                  </div>
                  <div>
                    <strong>PV iniciais:</strong> {classInfo[classe]?.pv}
                  </div>
                  <div>
                    <strong>PE iniciais:</strong> {classInfo[classe]?.pe}
                  </div>
                  <div>
                    <strong>SAN inicial:</strong> {classInfo[classe]?.san}
                  </div>
                  <div style={{ marginTop: "6px" }}>
                    <strong>Perícias:</strong> {classInfo[classe]?.pericias}
                  </div>
                  <div style={{ marginTop: "6px" }}>
                    <strong>Proficiências:</strong> {classInfo[classe]?.prof}
                  </div>
                  <div
                    style={{
                      marginTop: "8px",
                      color: "#cfd8dc",
                      lineHeight: 1.5,
                      whiteSpace: "pre-line",
                    }}
                  >
                    <strong>Núcleo de habilidades:</strong>
                    {"\n"}
                    {classInfo[classe]?.corePowers}
                  </div>
                </div>
              </div>
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <button onClick={() => setSetupStep(1)} style={styles.btnStep}>
                  Voltar
                </button>
                <button
                  onClick={() => setSetupStep(3)}
                  style={{ ...styles.btnStep, borderColor: colors.brand, color: colors.brand }}
                >
                  Próximo
                </button>
              </div>
            </div>
          )}

          {setupStep === 3 && (
            <div style={styles.summaryCard}>
              <div style={{ ...styles.attrLabel, marginBottom: "10px" }}>
                ETAPA 3/4 · TRILHA
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignContent: "flex-start" }}>
                  {trilhasDisponiveis.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTrilha(t)}
                      style={{
                        ...styles.btnStep,
                        borderColor: trilha === t ? colors.brand : "#333",
                        color: trilha === t ? colors.brand : "#999",
                        background: trilha === t ? `${colors.brand}11` : "#0b0b0f",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div style={{ border: "1px solid #2a2a2a", borderRadius: "10px", padding: "12px", background: "rgba(0,0,0,0.2)" }}>
                  <div style={{ color: colors.brand, marginBottom: "8px", fontSize: "12px" }}>
                    {trilha}
                  </div>
                  <div style={{ fontSize: "12px", color: "#cfd8dc", lineHeight: 1.5, whiteSpace: "pre-line" }}>
                    {(trilhasData[classe]?.[trilha] || [])
                      .map((h) => `NEX ${h.nex}% - ${h.nome}\n${h.desc}`)
                      .join("\n\n")}
                  </div>
                </div>
              </div>
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <button onClick={() => setSetupStep(2)} style={styles.btnStep}>
                  Voltar
                </button>
                <button
                  onClick={() => setSetupStep(4)}
                  style={{
                    ...styles.btnStep,
                    borderColor: colors.brand,
                    color: colors.brand,
                    fontWeight: "bold",
                  }}
                >
                  Próximo
                </button>
              </div>
            </div>
          )}

          {setupStep === 4 && (
            <div style={styles.summaryCard}>
              <div style={{ ...styles.attrLabel, marginBottom: "10px" }}>
                ETAPA 4/4 · CONFIRMAÇÃO
              </div>
              <div style={{ color: "#ddd", lineHeight: 1.7 }}>
                <div>
                  <strong>Origem:</strong> {origin}
                </div>
                <div>
                  <strong>Classe:</strong> {classe}
                </div>
                <div>
                  <strong>Trilha Inicial:</strong> {trilha}
                </div>
              </div>
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <button onClick={() => setSetupStep(3)} style={styles.btnStep}>
                  Voltar
                </button>
                <button
                  onClick={() => {
                    if (!nomePersonagem?.trim()) {
                      alert("Defina o nome do personagem antes de iniciar a ficha.");
                      return;
                    }
                    setOriginLocked(true);
                    setSetupComplete(true);
                    setActiveTab("status");
                  }}
                  style={{
                    ...styles.btnStep,
                    borderColor: colors.brand,
                    color: colors.brand,
                    fontWeight: "bold",
                  }}
                >
                  Iniciar Ficha
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div style={styles.body}>
      <button
        onClick={signOut}
        style={{
          position: "fixed",
          top: isMobile ? "10px" : "20px",
          right: isMobile ? "10px" : "20px",
          zIndex: 9999,
          background: "#ff1744",
          color: "#fff",
          border: "none",
          padding: isMobile ? "8px 12px" : "10px 14px",
          borderRadius: "8px",
          cursor: "pointer",
          fontFamily: "inherit",
          fontWeight: "bold",
          fontSize: isMobile ? "12px" : "14px",
          boxShadow: "0 0 10px rgba(255, 23, 68, 0.4)",
        }}
      >
        Sair
      </button>
      <button
        onClick={() => setPreMissionReady(false)}
        style={{
          position: "fixed",
          top: isMobile ? "10px" : "20px",
          right: isMobile ? "164px" : "208px",
          zIndex: 9999,
          background: "#10131a",
          color: "#d1d5db",
          border: "1px solid #3a3f4b",
          padding: isMobile ? "8px 10px" : "10px 12px",
          borderRadius: "8px",
          cursor: "pointer",
          fontFamily: "inherit",
          fontWeight: "bold",
          fontSize: isMobile ? "11px" : "13px",
        }}
      >
        Missão/Personagem
      </button>
      <button
        onClick={restartCharacterSetup}
        style={{
          position: "fixed",
          top: isMobile ? "10px" : "20px",
          right: isMobile ? "90px" : "96px",
          zIndex: 9999,
          background: "#1a1b22",
          color: colors.brand,
          border: `1px solid ${colors.brand}66`,
          padding: isMobile ? "8px 10px" : "10px 12px",
          borderRadius: "8px",
          cursor: "pointer",
          fontFamily: "inherit",
          fontWeight: "bold",
          fontSize: isMobile ? "12px" : "14px",
        }}
      >
        Recomeçar
      </button>
      {/* 👇 ANIMAÇÃO DE RITUAIS 👇 */}
      <style>
        {`
          @keyframes ritualCast {
            0% { opacity: 0; filter: contrast(1); }
            15% { opacity: 1; filter: contrast(1.3); }
            100% { opacity: 0; filter: contrast(1); }
          }
        `}
      </style>

      {efeitoRitual && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            pointerEvents: "none", // 👈 MUITO IMPORTANTE: permite clicar "através" do efeito
            zIndex: 10000,
            background:
              efeitoRitual === "Sangue"
                ? "radial-gradient(circle, transparent 30%, rgba(255, 23, 68, 0.45) 100%)"
                : efeitoRitual === "Morte"
                ? "radial-gradient(circle, transparent 30%, rgba(10, 10, 15, 0.9) 100%)"
                : efeitoRitual === "Conhecimento"
                ? "radial-gradient(circle, transparent 30%, rgba(255, 209, 102, 0.45) 100%)"
                : efeitoRitual === "Energia"
                ? "radial-gradient(circle, transparent 30%, rgba(0, 229, 255, 0.45) 100%)"
                : "radial-gradient(circle, transparent 30%, rgba(255, 255, 255, 0.6) 100%)", // Medo
            boxShadow: `inset 0 0 150px ${
              efeitoRitual === "Sangue"
                ? "#ff1744"
                : efeitoRitual === "Morte"
                ? "#000000"
                : efeitoRitual === "Conhecimento"
                ? "#ffd166"
                : efeitoRitual === "Energia"
                ? "#00e5ff"
                : "#ffffff"
            }`,
            animation: "ritualCast 1.5s ease-out forwards",
          }}
        />
      )}
      {/* 👆 FIM DA ANIMAÇÃO 👆 */}
      {nexPopup && (
        <div style={styles.popupOverlay}>
          <div style={styles.popupBox}>
            <h3
              style={{
                marginTop: 0,
                color: colors.brand,
                letterSpacing: "2px",
              }}
            >
              NEX {nexPopup.to}% DESBLOQUEADO
            </h3>
            <p
              style={{
                color: "#8fb7c4",
                fontSize: "12px",
                marginBottom: "18px",
              }}
            >
              Novos acessos liberados na progressão.
            </p>
            {nexPopup.unlocks.map((item, i) => (
              <div key={`${item.nome}-${i}`} style={styles.popupItem}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                    marginBottom: "6px",
                  }}
                >
                  <strong style={{ color: "#fff" }}>{item.nome}</strong>
                  <span
                    style={{
                      fontSize: "10px",
                      color: colors.pe,
                      background: "rgba(197, 160, 0, 0.1)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    NEX {item.nex}%
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    color: "#aaa",
                    fontSize: "12px",
                    lineHeight: 1.5,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
            <button
              onClick={() => setNexPopup(null)}
              style={{
                ...styles.btnStep,
                marginTop: "10px",
                padding: "10px 14px",
                borderColor: colors.brand,
                color: colors.brand,
                width: "100%",
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* 👇 MODAL DA BIBLIOTECA DE RITUAIS (EM TELA CHEIA) 👇 */}
      {isRitualModalOpen && (
        <div
          style={{
            ...styles.popupOverlay,
            width: "100vw",
            height: "100vh",
            top: 0,
            left: 0,
          }}
          onClick={() => setIsRitualModalOpen(false)}
        >
          <div
            style={{
              ...styles.popupBox,
              width: "100%",
              maxWidth: "850px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* CABEÇALHO DO MODAL */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                borderBottom: `1px solid ${colors.brand}44`,
                paddingBottom: "15px",
              }}
            >
              <h2
                style={{
                  color: colors.brand,
                  margin: 0,
                  letterSpacing: "2px",
                  fontSize: "18px",
                }}
              >
                BIBLIOTECA ARCANA
              </h2>
              <button
                onClick={() => setIsRitualModalOpen(false)}
                style={{
                  ...styles.btnStep,
                  borderColor: colors.pv,
                  color: colors.pv,
                }}
              >
                FECHAR ✖
              </button>
            </div>

            {/* FILTROS */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <select
                value={filtroElemento}
                onChange={(e) => setFiltroElemento(e.target.value)}
                style={styles.selectField}
              >
                <option value="Todos">Todos os Elementos</option>
                <option value="Conhecimento">Conhecimento</option>
                <option value="Energia">Energia</option>
                <option value="Medo">Medo</option>
                <option value="Morte">Morte</option>
                <option value="Sangue">Sangue</option>
              </select>

              <select
                value={filtroCirculo}
                onChange={(e) => setFiltroCirculo(e.target.value)}
                style={styles.selectField}
              >
                <option value="Todos">Todos os Círculos</option>
                <option value="1">1º Círculo</option>
                <option value="2">2º Círculo</option>
                <option value="3">3º Círculo</option>
                <option value="4">4º Círculo</option>
              </select>
            </div>

            {/* GRID DE RITUAIS FILTRADOS */}
            <div
              style={{
                ...styles.tabGrid,
                overflowY: "auto",
                paddingRight: "10px",
                flex: 1,
              }}
            >
              {rituaisCatalog
                .filter((r) => !rituaisSelecionados.includes(r.nome))
                .filter(
                  (r) =>
                    filtroElemento === "Todos" || r.elemento === filtroElemento
                )
                .filter(
                  (r) =>
                    filtroCirculo === "Todos" ||
                    r.circulo.toString() === filtroCirculo
                )
                .sort(
                  (a, b) =>
                    a.circulo - b.circulo ||
                    a.elemento.localeCompare(b.elemento)
                )
                .map((r) => {
                  let corRitual = colors.pe;
                  if (r.elemento === "Morte") corRitual = "#9e9e9e";
                  if (r.elemento === "Sangue") corRitual = "#ff1744";
                  if (r.elemento === "Energia") corRitual = "#00e5ff";
                  if (r.elemento === "Conhecimento") corRitual = "#ffd166";
                  if (r.elemento === "Medo") corRitual = "#ffffff";

                  return (
                    <div
                      key={r.nome}
                      style={{
                        ...styles.summaryCard,
                        borderLeft: `3px solid ${corRitual}`,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "8px",
                          }}
                        >
                          <strong
                            style={{
                              color: "#fff",
                              fontSize: "14px",
                              letterSpacing: "1px",
                            }}
                          >
                            {r.nome.toUpperCase()}
                          </strong>
                          <span
                            style={{
                              fontSize: "10px",
                              color: corRitual,
                              background: `${corRitual}11`,
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            {r.circulo}º CÍRCULO
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: "11px",
                            color: "#aaa",
                            lineHeight: 1.6,
                            margin: "0 0 15px 0",
                            whiteSpace: "pre-line",
                          }}
                        >
                          {r.desc}
                          {r.discente && (
                            <>
                              <br />
                              <br />
                              <span style={{ color: "#00e5ff" }}>
                                [ DISCENTE ]: {r.discente.desc}
                              </span>
                            </>
                          )}
                          {r.verdadeiro && (
                            <>
                              <br />
                              <br />
                              <span style={{ color: "#ffd166" }}>
                                [ VERDADEIRO ]: {r.verdadeiro.desc}
                              </span>
                            </>
                          )}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          setRituaisSelecionados([
                            ...rituaisSelecionados,
                            r.nome,
                          ])
                        }
                        style={{
                          ...styles.btnStep,
                          width: "100%",
                          borderColor: corRitual,
                          color: corRitual,
                          fontWeight: "bold",
                        }}
                      >
                        + APRENDER
                      </button>
                    </div>
                  );
                })}
            </div>
            {/* MENSAGEM SE NÃO ACHAR NADA */}
            {rituaisCatalog.filter(
              (r) =>
                !rituaisSelecionados.includes(r.nome) &&
                (filtroElemento === "Todos" || r.elemento === filtroElemento) &&
                (filtroCirculo === "Todos" ||
                  r.circulo.toString() === filtroCirculo)
            ).length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  color: "#666",
                  padding: "40px 0",
                }}
              >
                Nenhum ritual novo encontrado com esses filtros.
              </div>
            )}
          </div>
        </div>
      )}
      {/* 👆 FIM DO MODAL DE RITUAIS 👆 */}

      <nav
        style={{
          ...styles.sidebar,
          width: isMobile ? "58px" : "74px",
          gap: isMobile ? "14px" : "24px",
          padding: isMobile ? "12px 0" : "18px 0",
        }}
      >
        <div
          style={{
            color: colors.brand,
            fontWeight: "bold",
            fontSize: "12px",
            marginBottom: "20px",
            letterSpacing: "2px",
          }}
        >
          A.S.A
        </div>
        <button
          onClick={() => setActiveTab("status")}
          style={{
            ...styles.navBtn,
            fontSize: isMobile ? "22px" : styles.navBtn.fontSize,
            color: activeTab === "status" ? colors.brand : "#333",
          }}
          title="Bio-Monitor"
        >
          <TabGlyph tab="status" active={activeTab === "status"} />
        </button>
        <button
          onClick={() => setActiveTab("classe")}
          style={{
            ...styles.navBtn,
            fontSize: isMobile ? "22px" : styles.navBtn.fontSize,
            color: activeTab === "classe" ? colors.brand : "#333",
          }}
          title="Arquétipo"
        >
          <TabGlyph tab="classe" active={activeTab === "classe"} />
        </button>
        <button
          onClick={() => setActiveTab("pericias")}
          style={{
            ...styles.navBtn,
            fontSize: isMobile ? "22px" : styles.navBtn.fontSize,
            color: activeTab === "pericias" ? colors.brand : "#333",
          }}
          title="Perícias"
        >
          <TabGlyph tab="pericias" active={activeTab === "pericias"} />
        </button>
        <button
          onClick={() => setActiveTab("rituais")}
          style={{
            ...styles.navBtn,
            fontSize: isMobile ? "22px" : styles.navBtn.fontSize,
            color: activeTab === "rituais" ? colors.brand : "#333",
          }}
          title="Rituais"
        >
          <TabGlyph tab="rituais" active={activeTab === "rituais"} />
        </button>
        <button
          onClick={() => setActiveTab("inventario")}
          style={{
            ...styles.navBtn,
            fontSize: isMobile ? "22px" : styles.navBtn.fontSize,
            color: activeTab === "inventario" ? colors.brand : "#333",
          }}
          title="Inventário"
        >
          <TabGlyph tab="inventario" active={activeTab === "inventario"} />
        </button>
        {isDM && (
          <button
            onClick={() => setActiveTab("bestiario")}
            style={{
              ...styles.navBtn,
              fontSize: isMobile ? "22px" : styles.navBtn.fontSize,
              color: activeTab === "bestiario" ? colors.brand : "#333",
            }}
            title="Bestiario"
          >
            <TabGlyph tab="bestiario" active={activeTab === "bestiario"} />
          </button>
        )}
        <button
          onClick={() => setActiveTab("combate")}
          style={{
            ...styles.navBtn,
            fontSize: isMobile ? "22px" : styles.navBtn.fontSize,
            color: activeTab === "combate" ? colors.brand : "#333",
          }}
          title="Mesa de Combate"
        >
          <TabGlyph tab="combate" active={activeTab === "combate"} />
        </button>
        {isDM && (
          <button
            onClick={() => setActiveTab("admin")}
            style={{
              ...styles.navBtn,
              fontSize: isMobile ? "22px" : styles.navBtn.fontSize,
              color: activeTab === "admin" ? colors.brand : "#333",
            }}
            title="Admin"
          >
            <TabGlyph tab="classe" active={activeTab === "admin"} />
          </button>
        )}
      </nav>

      <main
        style={{
          ...styles.mainContent,
          marginLeft: isMobile ? "58px" : "74px",
          width: isMobile ? "calc(100% - 58px)" : "calc(100% - 74px)",
          padding: isMobile ? "12px" : "20px",
        }}
      >
        {/* ABA 1: STATUS (BIO-MONITOR) */}
        {activeTab === "status" && (
          <div style={styles.container}>
            <div style={{ textAlign: "center", marginBottom: "10px" }}>
              <h2
                style={{
                  color: colors.brand,
                  letterSpacing: isMobile ? "2px" : "5px",
                  fontSize: isMobile ? "24px" : "30px",
                  margin: 0,
                  textShadow: colors.glow,
                }}
              >
                A.S.A. BIO-MONITOR
              </h2>
              <small style={{ color: "#4a4a4a" }}>
                SYSTEM_VERSION: v6.0 [RULES_PATCHED]
              </small>
            </div>

            {/* NOME DO PERSONAGEM - INPUT COM SUPABASE */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "10px",
              }}
            >
              <input
                type="text"
                value={nomePersonagem}
                onChange={(e) => setNomePersonagem(e.target.value)}
                onBlur={handleSalvarNome}
                placeholder="[ INSIRA O NOME DE IDENTIFICAÇÃO ]"
                style={{
                  ...styles.inputField,
                  width: "100%",
                  maxWidth: "400px",
                  fontSize: "14px",
                  borderBottom: `1px solid ${colors.brand}`,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                }}
              />
            </div>

            {attrError && (
              <div
                style={{
                  color: colors.pv,
                  fontSize: "12px",
                  fontWeight: "bold",
                  textAlign: "center",
                  marginBottom: "10px",
                  padding: "8px",
                  border: `1px solid ${colors.pv}`,
                  background: "rgba(255, 23, 68, 0.1)",
                  letterSpacing: "1px",
                  borderRadius: "10px",
                }}
              >
                [ ALERTA DE SISTEMA: {attrError} ]
              </div>
            )}

            <div
              style={{
                textAlign: "center",
                color: "#666",
                fontSize: "11px",
                marginBottom: "5px",
              }}
            >
              CARGA DE ATRIBUTOS (NEX {nex}%):{" "}
              <span
                style={{
                  color:
                    currentTotalPoints === maxTotalPoints
                      ? colors.brand
                      : "#fff",
                }}
              >
                {currentTotalPoints} / {maxTotalPoints}
              </span>
            </div>

            <div
              style={{
                ...styles.mandalaContainer,
                width: `${mandalaSize}px`,
                height: `${mandalaSize}px`,
              }}
            >
              <div
                style={{
                  ...styles.centralSymbol,
                  width: `${mandalaSize}px`,
                  height: `${mandalaSize}px`,
                }}
              >
                <img
                  src="https://i.imgur.com/kbm8h0V.png"
                  alt="Maestro"
                  style={{
                    width: "100%",
                    maxWidth: `${mandalaSize}px`,
                    mixBlendMode: "screen",
                  }}
                />
              </div>
              {ATTR_KEYS.map((key, index) => {
                const angle = (index * 72 - 90) * (Math.PI / 180);
                const radius = attrRadius;
                const individualOffsets = {
                  FOR: { x: 0, y: 20 },
                  AGI: { x: 0, y: 15 },
                  INT: { x: 2, y: 10 },
                  VIG: { x: -7, y: 10 },
                  PRE: { x: 5, y: 15 },
                };
                const offset = individualOffsets[key] || { x: 0, y: 0 };
                const x = Math.cos(angle) * radius + offset.x;
                const y = Math.sin(angle) * radius + offset.y;
                return (
                  <div
                    key={key}
                    style={{
                      ...styles.attributeNode,
                      width: `${nodeSize}px`,
                      height: `${nodeSize}px`,
                      transform: `translate(${x}px, ${y}px)`,
                    }}
                    onClick={() => setEditingAttr(key)}
                  >
                    <span style={styles.attrLabel}>{key}</span>
                    {editingAttr === key ? (
                      <input
                        type="number"
                        min={0}
                        max={maxSingleAttr}
                        value={attrs[key]}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleAttrChange(key, e.target.value)}
                        onBlur={() => setEditingAttr(null)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === "Escape")
                            setEditingAttr(null);
                        }}
                        style={styles.inputField}
                      />
                    ) : (
                      <span style={styles.attrValue}>{attrs[key]}</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={styles.statusBox}>
              <div style={styles.infoRow}>
                <div style={styles.dataBlock}>
                  <label style={styles.attrLabel}>NEX %</label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <button
                      style={styles.btnStep}
                      onClick={() =>
                        setNex(NEX_VALUES[Math.max(0, nexIndex - 1)])
                      }
                    >
                      -
                    </button>
                    <span
                      style={{
                        color: colors.brand,
                        fontSize: "20px",
                        fontWeight: "bold",
                      }}
                    >
                      {nex}%
                    </span>
                    <button
                      style={styles.btnStep}
                      onClick={() =>
                        setNex(
                          NEX_VALUES[
                            Math.min(NEX_VALUES.length - 1, nexIndex + 1)
                          ]
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    ...styles.dataBlock,
                    borderLeft: "1px solid #222",
                    borderRight: "1px solid #222",
                  }}
                >
                  <label style={styles.attrLabel}>LIMITE PE</label>
                  <div
                    style={{
                      color: colors.pe,
                      fontSize: "28px",
                      fontWeight: "bold",
                    }}
                  >
                    {limitePE}
                  </div>
                  {limitePERitual !== limitePE && (
                    <small style={{ color: "#b89700" }}>
                      Rituais: {limitePERitual}
                    </small>
                  )}
                </div>
                <div style={styles.dataBlock}>
                  <label style={styles.attrLabel}>DESLOCAMENTO</label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "4px",
                    }}
                  >
                    <input
                      type="number"
                      value={deslocamento}
                      onChange={(e) =>
                        setDeslocamento(Number(e.target.value) || 0)
                      }
                      style={{ ...styles.inputField, width: "35px" }}
                    />
                    <span style={{ fontSize: "12px", color: "#444" }}>m</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  ...styles.infoRow,
                  borderBottom: "none",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    ...styles.dataBlock,
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: "30px",
                    width: "100%",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <label style={styles.attrLabel}>DEFESA TOTAL</label>
                    <div
                      style={{
                        color: "#fff",
                        fontSize: "32px",
                        fontWeight: "bold",
                        textShadow: "0 0 15px rgba(255,255,255,0.2)",
                      }}
                    >
                      {defesaTotal}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "15px",
                      alignItems: "center",
                      background: "#000",
                      padding: "8px 15px",
                      borderRadius: "8px",
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <label style={{ ...styles.attrLabel, fontSize: "9px" }}>
                        EQUIP.
                      </label>
                      <input
                        type="number"
                        value={defArmadura}
                        onChange={(e) =>
                          setDefArmadura(Number(e.target.value) || 0)
                        }
                        style={styles.inputSmall}
                      />
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <label style={{ ...styles.attrLabel, fontSize: "9px" }}>
                        OUTROS
                      </label>
                      <input
                        type="number"
                        value={defOutros}
                        onChange={(e) =>
                          setDefOutros(Number(e.target.value) || 0)
                        }
                        style={styles.inputSmall}
                      />
                    </div>
                    <div style={{ textAlign: "center", opacity: 0.7 }}>
                      <label style={{ ...styles.attrLabel, fontSize: "9px" }}>
                        BASE+AGI
                      </label>
                      <div style={{ fontSize: "12px", color: colors.brand }}>
                        {10 + attrs.AGI}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <StatusControl
                label="PV"
                current={pvAtual}
                max={maxPVCalculado}
                setCurrent={setPvAtual}
                color={colors.pv}
              />
              <StatusControl
                label="PE"
                current={peAtual}
                max={maxPECalculado}
                setCurrent={setPeAtual}
                color={colors.pe}
              />
              <StatusControl
                label="SAN"
                current={sanAtual}
                max={maxSANCalculado}
                setCurrent={setSanAtual}
                color={colors.san}
              />
            </div>
          </div>
        )}

        {/* ABA 2: ARQUÉTIPO (CLASSE E ORIGEM) */}
        {activeTab === "classe" && (
          <div style={styles.container}>
            <div style={styles.statusBox}>
              <h2 style={styles.sectionTitle}>PROFILER_ARQUÉTIPO</h2>
              {profileError && (
                <div
                  style={{
                    color: colors.pv,
                    fontSize: "12px",
                    fontWeight: "bold",
                    textAlign: "center",
                    marginBottom: "14px",
                    padding: "8px",
                    border: `1px solid ${colors.pv}`,
                    background: "rgba(255, 23, 68, 0.1)",
                    borderRadius: "10px",
                  }}
                >
                  [ ALERTA DE PERFIL: {profileError} ]
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                }}
              >
                {["Combatente", "Especialista", "Ocultista"].map((c) => (
                  <button
                    key={c}
                    onClick={() => handleClasseChange(c)}
                    disabled={setupComplete}
                    style={{
                      flex: 1,
                      minWidth: "180px",
                      padding: "15px",
                      background: classe === c ? `${colors.brand}22` : "#000",
                      border: `1px solid ${
                        classe === c ? colors.brand : "#333"
                      }`,
                      color: classe === c ? colors.brand : "#666",
                      cursor: setupComplete ? "not-allowed" : "pointer",
                      opacity: setupComplete ? 0.75 : 1,
                      fontFamily: "inherit",
                      borderRadius: "10px",
                    }}
                  >
                    {c.toUpperCase()}
                  </button>
                ))}
              </div>
              <div style={styles.tabGrid}>
                <div style={styles.summaryCard}>
                  <div style={{ ...styles.attrLabel, marginBottom: "6px" }}>
                    ORIGEM
                  </div>
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    disabled={setupComplete}
                    style={styles.selectField}
                  >
                    {Object.keys(originsData).map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <div
                    style={{
                      color: originLocked
                        ? TRAINING_THEME.auto.text
                        : colors.muted,
                      fontSize: "12px",
                      marginTop: "8px",
                    }}
                  >
                    {originLocked
                      ? `Origem confirmada: ${
                          originSkills.join(" • ") || "sem treino automático"
                        }`
                      : "Confirme a origem para liberar os treinos automáticos."}
                  </div>
                </div>
                <div style={styles.summaryCard}>
                  <div style={{ ...styles.attrLabel, marginBottom: "6px" }}>
                    TRILHA
                  </div>
                  <select
                    value={trilha}
                    onChange={(e) => setTrilha(e.target.value)}
                    disabled={setupComplete}
                    style={styles.selectField}
                  >
                    {trilhasDisponiveis.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.summaryCard}>
                  <div style={{ ...styles.attrLabel, marginBottom: "6px" }}>
                    SÍNTESE
                  </div>
                  <div style={{ fontSize: "14px", lineHeight: 1.6 }}>
                    <div>
                      <strong>Classe:</strong> {classe}
                    </div>
                    <div>
                      <strong>Origem:</strong> {origin}
                    </div>
                    <div>
                      <strong>NEX:</strong> {nex}%
                    </div>
                    <div>
                      <strong>Poderes:</strong> {powerSlots}
                    </div>
                    <div>
                      <strong>Transcender:</strong>{" "}
                      {selectedPowers.filter((p) => p === "Transcender").length}
                    </div>
                  </div>
                </div>
              </div>
              <div
                style={{
                  marginTop: "18px",
                  marginBottom: "20px",
                  background: "rgba(0,0,0,0.35)",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "12px",
                  padding: "14px",
                }}
              >
                <div style={{ ...styles.attrLabel, marginBottom: "10px" }}>
                  TRILHAS DA CLASSE ({classe.toUpperCase()})
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {Object.entries(trilhasData[classe] || {}).map(
                    ([nomeTrilha, habilidades]) => (
                      <div
                        key={nomeTrilha}
                        style={{
                          ...styles.summaryCard,
                          borderColor:
                            trilha === nomeTrilha ? `${colors.brand}66` : "#262a30",
                        }}
                      >
                        <div
                          style={{
                            color: trilha === nomeTrilha ? colors.brand : "#d7dde5",
                            fontWeight: "bold",
                            fontSize: "12px",
                            letterSpacing: "1px",
                            marginBottom: "8px",
                          }}
                        >
                          {nomeTrilha}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#cfd8dc",
                            lineHeight: 1.5,
                            whiteSpace: "pre-line",
                          }}
                        >
                          {habilidades
                            .map((h) => `NEX ${h.nex}% - ${h.nome}\n${h.desc}`)
                            .join("\n\n")}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
              <div
                style={{
                  marginTop: "18px",
                  marginBottom: "20px",
                  background: "rgba(0,0,0,0.35)",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "12px",
                  padding: "14px",
                }}
              >
                <div style={{ ...styles.attrLabel, marginBottom: "10px" }}>
                  SELEÇÃO DE PERÍCIAS AUTOMÁTICAS
                </div>
                {regra.fixedChoices.length === 0 ? (
                  <div style={{ color: colors.muted, fontSize: "12px" }}>
                    Esta classe não exige escolhas fixas. Basta confirmar a
                    origem para travar os treinos automáticos.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "12px",
                    }}
                  >
                    {regra.fixedChoices.map((choice, idx) => (
                      <label
                        key={choice.label}
                        style={{ display: "grid", gap: "6px" }}
                      >
                        <span style={{ color: "#bdbdbd", fontSize: "11px" }}>
                          {choice.label}
                        </span>
                        <select
                          value={classSkillChoices[idx] ?? ""}
                          onChange={(e) => {
                            const next = [...classSkillChoices];
                            next[idx] = e.target.value;
                            if (
                              new Set(next.filter(Boolean)).size !==
                              next.filter(Boolean).length
                            ) {
                              flashProfileError(
                                "As escolhas fixas da classe não podem se repetir."
                              );
                              return;
                            }
                            setClassSkillChoices(next);
                          }}
                          style={styles.selectField}
                        >
                          <option value="">Selecione</option>
                          {choice.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginTop: "14px",
                  }}
                >
                  <button
                    onClick={lockOriginAndClassSkills}
                    style={{
                      ...styles.btnStep,
                      padding: "10px 14px",
                      borderColor: TRAINING_THEME.auto.border,
                      color: TRAINING_THEME.auto.text,
                      boxShadow: TRAINING_THEME.auto.glow,
                    }}
                  >
                    Confirmar origem e classe
                  </button>
                  <button
                    onClick={() => {
                      setOriginLocked(false);
                      setProfileError("");
                    }}
                    style={{ ...styles.btnStep, padding: "10px 14px" }}
                  >
                    Liberar edição
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  margin: "22px 0 15px",
                }}
              >
                <h3
                  style={{ fontSize: "14px", color: colors.brand, margin: 0 }}
                >
                  HABILIDADES DESBLOQUEADAS
                </h3>
                <span style={{ fontSize: "12px", color: "#666" }}>
                  NEX ATUAL:{" "}
                  <strong style={{ color: colors.brand }}>{nex}%</strong>
                </span>
              </div>

              {habilidadesAtuais.length > 0 ? (
                habilidadesAtuais.map((h, idx) => (
                  <div key={`${h.nome}-${h.nex}-${idx}`} style={styles.habCard}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "5px",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <strong style={{ color: "#fff", letterSpacing: "1px" }}>
                          {h.nome.toUpperCase()}
                        </strong>
                        <span
                          style={{
                            fontSize: "10px",
                            color:
                              h.tipo === "classe"
                                ? "#00e5ff"
                                : h.tipo === "progressão"
                                ? "#ffd166"
                                : "#ff4fd8",
                            border: "1px solid rgba(255,255,255,0.12)",
                            padding: "2px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          {(h.tipo || "trilha").toUpperCase()}
                        </span>

                        {/* 👇 BOTÃO DE LOG ADICIONADO AQUI 👇 */}
                        <button
                          onClick={async () => {
                            const pNome =
                              nomePersonagem || user.email.split("@")[0];
                            const textoAcao = `Usou a habilidade: ${h.nome.toUpperCase()}`;
                            alert(textoAcao);
                            await supabase.from("combat_log").insert([
                              {
                                personagem: pNome,
                                acao: textoAcao,
                                rodada: rodadaAtual,
                              },
                            ]);
                          }}
                          style={{
                            background: "none",
                            border: `1px solid ${colors.brand}55`,
                            color: colors.brand,
                            borderRadius: "4px",
                            padding: "2px 8px",
                            fontSize: "9px",
                            cursor: "pointer",
                            marginLeft: "10px",
                          }}
                        >
                          ENVIAR PRO LOG
                        </button>
                      </div>
                      <span
                        style={{
                          fontSize: "10px",
                          color: colors.pe,
                          background: "rgba(197, 160, 0, 0.1)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        NEX {h.nex}%
                      </span>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        color: "#aaa",
                        lineHeight: "1.5",
                        whiteSpace: "pre-line",
                      }}
                    >
                      {h.desc}
                    </p>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    border: "1px dashed #333",
                    borderRadius: "10px",
                  }}
                >
                  <p style={{ color: "#444", fontSize: "12px", margin: 0 }}>
                    Aumente seu NEX na tela de Bio-Monitor para desbloquear
                    habilidades.
                  </p>
                </div>
              )}

              <div style={{ marginTop: "26px" }}>
                <h3
                  style={{
                    fontSize: "14px",
                    color: colors.brand,
                    margin: "0 0 12px 0",
                  }}
                >
                  PODERES DA CLASSE
                </h3>
                <div style={styles.tabGrid}>
                  {Array.from({ length: powerSlots }).map((_, index) => {
                    const selectedPowerName = selectedPowers[index] || "";
                    const selectedPowerData = classPowers[classe].find(
                      (p) => p.nome === selectedPowerName
                    );
                    const selectedParanormalName =
                      selectedParanormalPowers[index] || "";
                    const selectedParanormalData = paranormalPowers.find(
                      (p) => p.nome === selectedParanormalName
                    );

                    return (
                      <div key={index} style={styles.summaryCard}>
                        <div
                          style={{ ...styles.attrLabel, marginBottom: "8px" }}
                        >
                          PODER {index + 1}
                        </div>
                        <select
                          value={selectedPowerName}
                          onChange={(e) =>
                            handleSelectPower(index, e.target.value)
                          }
                          style={styles.selectField}
                        >
                          <option value="">Selecione um poder</option>
                          {classPowers[classe]
                            .filter(
                              (power) =>
                                !selectedPowers.includes(power.nome) ||
                                power.nome === selectedPowers[index] ||
                                [
                                  "Transcender",
                                  "Treinamento em Perícia",
                                  "Especialista em Elemento",
                                  "Mestre em Elemento",
                                  "Ritual Predileto",
                                ].includes(power.nome) // 👈 PERMITE REPETIR ESSES AQUI!
                            )
                            .map((power) => (
                              <option key={power.nome} value={power.nome}>
                                {power.nome}
                              </option>
                            ))}
                        </select>
                        {selectedPowerData && (
                          <p
                            style={{
                              marginTop: "10px",
                              fontSize: "12px",
                              color: "#aaa",
                              lineHeight: 1.5,
                            }}
                          >
                            {selectedPowerData.desc}
                          </p>
                        )}

                        {selectedPowerName === "Transcender" && (
                          <>
                            <div
                              style={{
                                ...styles.attrLabel,
                                marginTop: "12px",
                                marginBottom: "8px",
                              }}
                            >
                              PODER PARANORMAL
                            </div>
                            <select
                              value={selectedParanormalName}
                              onChange={(e) =>
                                handleSelectParanormalPower(
                                  index,
                                  e.target.value
                                )
                              }
                              style={{
                                ...styles.selectField,
                                color: "#ff4fd8",
                                border: "1px solid rgba(255, 79, 216, 0.35)",
                              }}
                            >
                              <option value="">
                                Selecione um poder paranormal
                              </option>
                              {paranormalPowers
                                .filter(
                                  (power) =>
                                    !selectedParanormalPowers.includes(
                                      power.nome
                                    ) ||
                                    power.nome ===
                                      selectedParanormalPowers[index] ||
                                    [
                                      "Aprender Ritual",
                                      "Resistir a Elemento", // No seu catálogo está salvo como "Resistir a"
                                      "Expansão de Conhecimento",
                                    ].includes(power.nome) // 👈 PERMITE REPETIR ESSES TAMBÉM!
                                )
                                .map((power) => (
                                  <option key={power.nome} value={power.nome}>
                                    {power.nome}
                                  </option>
                                ))}
                            </select>
                            {selectedParanormalData && (
                              <p
                                style={{
                                  marginTop: "10px",
                                  fontSize: "12px",
                                  color: "#caa3ff",
                                  lineHeight: 1.5,
                                }}
                              >
                                {selectedParanormalData.desc}
                              </p>
                            )}
                          </>
                        )}
                        {/* 👇 BOTÃO DE LOG DO PODER ADICIONADO AQUI 👇 */}
                        {selectedPowerName && (
                          <button
                            onClick={async () => {
                              const pNome =
                                nomePersonagem || user.email.split("@")[0];
                              const poderReal =
                                selectedPowerName === "Transcender"
                                  ? selectedParanormalName
                                  : selectedPowerName;

                              if (!poderReal) return;

                              const textoAcao = `Usou o poder: ${poderReal.toUpperCase()}`;
                              alert(textoAcao);

                              await supabase.from("combat_log").insert([
                                {
                                  personagem: pNome,
                                  acao: textoAcao,
                                  rodada: rodadaAtual,
                                },
                              ]);
                            }}
                            style={{
                              ...styles.btnStep,
                              width: "100%",
                              marginTop: "12px",
                              borderColor: colors.brand,
                              color: colors.brand,
                              background: "rgba(0, 229, 255, 0.05)",
                            }}
                          >
                            ENVIAR PRO LOG DA MESA
                          </button>
                        )}
                        {/* 👆 FIM DO BOTÃO 👆 */}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: PERÍCIAS */}
        {activeTab === "pericias" && (
          <div style={styles.container}>
            <div style={styles.statusBox}>
              <h2 style={styles.sectionTitle}>MÓDULO_DE_PERÍCIAS</h2>
              {skillsError && (
                <div
                  style={{
                    color: colors.pv,
                    fontSize: "12px",
                    fontWeight: "bold",
                    textAlign: "center",
                    marginBottom: "14px",
                    padding: "8px",
                    border: `1px solid ${colors.pv}`,
                    background: "rgba(255, 23, 68, 0.1)",
                    borderRadius: "10px",
                  }}
                >
                  [ ALERTA DE TREINAMENTO: {skillsError} ]
                </div>
              )}
              <div style={{ ...styles.tabGrid, marginBottom: "18px" }}>
                <div style={styles.summaryCard}>
                  <div style={{ ...styles.attrLabel, marginBottom: "8px" }}>
                    Origem
                  </div>
                  <div style={{ fontSize: "14px" }}>{origin}</div>
                  <div
                    style={{
                      color: originLocked
                        ? TRAINING_THEME.auto.text
                        : colors.muted,
                      fontSize: "12px",
                      marginTop: "8px",
                    }}
                  >
                    {originLocked
                      ? originSkills.length
                        ? originSkills.join(" • ")
                        : "sem treino automático"
                      : "Origem ainda não confirmada no profiler."}
                  </div>
                </div>
                <div style={styles.summaryCard}>
                  <div style={{ ...styles.attrLabel, marginBottom: "8px" }}>
                    Treinos automáticos da classe
                  </div>
                  <div
                    style={{
                      color: fixedClassSkills.length
                        ? TRAINING_THEME.auto.text
                        : colors.muted,
                      fontSize: "12px",
                      lineHeight: 1.7,
                    }}
                  >
                    {fixedClassSkills.length
                      ? fixedClassSkills.join(" • ")
                      : "Nenhum definido ainda."}
                  </div>
                  <div
                    style={{
                      color: colors.muted,
                      fontSize: "11px",
                      marginTop: "8px",
                    }}
                  >
                    {originLocked
                      ? "Essas perícias recebem destaque especial e não podem ser removidas por engano."
                      : "Confirme origem e classe na aba PROFILER_ARQUÉTIPO."}
                  </div>
                </div>
                <div style={styles.summaryCard}>
                  <div style={{ ...styles.attrLabel, marginBottom: "8px" }}>
                    Controle
                  </div>
                  <div style={{ fontSize: "14px", lineHeight: 1.7 }}>
                    <div>
                      <strong>Grau máximo:</strong> {trainingCap}
                    </div>
                    <div>
                      <strong>Perícias livres:</strong> {freeChoicesUsed} /{" "}
                      {freeChoicesAllowed}
                    </div>
                    <div>
                      <strong>Total treinadas:</strong> {totalChosenTrained} /{" "}
                      {expectedTrainedCount}
                    </div>
                  </div>
                  <button
                    onClick={resetSkills}
                    style={{
                      ...styles.btnStep,
                      marginTop: "10px",
                      padding: "10px 14px",
                      borderColor: colors.pv,
                      color: colors.pv,
                      width: "100%",
                      display: "block",
                      fontWeight: "bold",
                    }}
                  >
                    Resetar perícias
                  </button>
                </div>
              </div>
              <div
                style={{
                  overflowX: "auto",
                  background: "rgba(0,0,0,0.4)",
                  borderRadius: "12px",
                  border: `1px solid ${colors.border}`,
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: isMobile ? "620px" : "760px",
                  }}
                >
                  <thead>
                    <tr>
                      {[
                        "PERÍCIA",
                        "DADOS",
                        "BÔNUS",
                        "TREINO",
                        "OUTROS",
                        "GRAU",
                      ].map((header) => (
                        <th
                          key={header}
                          style={{
                            textAlign: "left",
                            fontSize: "12px",
                            color: "#bdbdbd",
                            padding: "14px 12px",
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {skillsCatalog.map((skill) => {
                      const auto = isAutoTrained(skill.nome);
                      const currentTraining = auto
                        ? skillStates[skill.nome]?.treino === "destreinado"
                          ? "treinado"
                          : skillStates[skill.nome]?.treino || "treinado"
                        : skillStates[skill.nome]?.treino || "destreinado";
                      const outros = skillStates[skill.nome]?.outros || 0;
                      const bonus = TRAINING_BONUS[currentTraining] + outros;
                      const attrValue = attrs[skill.attr];
                      const theme = auto
                        ? TRAINING_THEME.auto
                        : currentTraining === "destreinado"
                        ? TRAINING_THEME.normal
                        : TRAINING_THEME[currentTraining];

                      return (
                        <tr
                          key={skill.nome}
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                            boxShadow: auto ? TRAINING_THEME.auto.glow : "none",
                          }}
                        >
                          <td style={{ padding: "12px" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                color: theme.text,
                                fontWeight:
                                  currentTraining !== "destreinado" || auto
                                    ? "bold"
                                    : "normal",
                              }}
                            >
                              <span
                                style={{
                                  color: theme.text,
                                  textShadow: theme.glow,
                                }}
                              >
                                {auto ? "⬢" : "◈"}
                              </span>
                              <span>
                                {skill.nome}
                                {skill.carga ? "+" : ""}
                                {skill.trainedOnly ? "*" : ""}
                              </span>
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              color: auto
                                ? TRAINING_THEME.auto.text
                                : "#d8d8d8",
                            }}
                          >
                            ( {skill.attr} ){" "}
                            <span style={{ color: "#8f8f8f" }}>
                              ({attrValue})
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              color: bonus > 0 ? theme.text : "#a0a0a0",
                              textShadow:
                                currentTraining !== "destreinado" || auto
                                  ? theme.glow
                                  : "none",
                            }}
                          >
                            {bonus}
                          </td>
                          <td style={{ padding: "12px" }}>
                            <span
                              style={{
                                color:
                                  TRAINING_BONUS[currentTraining] > 0 || auto
                                    ? theme.text
                                    : "#8f8f8f",
                                textShadow:
                                  currentTraining !== "destreinado" || auto
                                    ? theme.glow
                                    : "none",
                              }}
                            >
                              {TRAINING_LABEL[currentTraining]}
                            </span>
                          </td>
                          <td style={{ padding: "12px" }}>
                            <input
                              type="number"
                              value={outros}
                              onChange={(e) =>
                                setSkillOtherBonus(skill.nome, e.target.value)
                              }
                              style={{
                                ...styles.inputSmall,
                                color: auto
                                  ? TRAINING_THEME.auto.text
                                  : "#d8d8d8",
                                width: "56px",
                                borderBottom: `1px dashed ${
                                  auto ? TRAINING_THEME.auto.border : "#444"
                                }`,
                              }}
                            />
                          </td>
                          <td style={{ padding: "12px" }}>
                            <select
                              value={currentTraining}
                              onChange={(e) =>
                                setSkillTraining(skill.nome, e.target.value)
                              }
                              style={{
                                background: "#000",
                                color: theme.text,
                                padding: "7px",
                                border: `1px solid ${theme.border}`,
                                borderRadius: "8px",
                                fontFamily: "inherit",
                                boxShadow:
                                  currentTraining !== "destreinado" || auto
                                    ? theme.glow
                                    : "none",
                              }}
                            >
                              <option value="destreinado">Destreinado</option>
                              <option value="treinado">Treinado</option>
                              <option value="veterano">Veterano</option>
                              <option value="expert">Expert</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "14px",
                  marginTop: "14px",
                  flexWrap: "wrap",
                  color: "#c5c5c5",
                  fontSize: "12px",
                }}
              >
                <span>+ Penalidade de carga.</span>
                <span>* Somente treinada.</span>
                <span>
                  <strong style={{ color: TRAINING_THEME.treinado.text }}>
                    Treinado
                  </strong>{" "}
                  •{" "}
                  <strong style={{ color: TRAINING_THEME.veterano.text }}>
                    Veterano
                  </strong>{" "}
                  •{" "}
                  <strong style={{ color: TRAINING_THEME.expert.text }}>
                    Expert
                  </strong>{" "}
                  •{" "}
                  <strong style={{ color: TRAINING_THEME.auto.text }}>
                    Auto
                  </strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ABA 4: RITUAIS */}
        {activeTab === "rituais" && (
          <div style={styles.container}>
            <div style={styles.statusBox}>
              <h2 style={styles.sectionTitle}>MÓDULO_DE_RITUAIS</h2>

              {/* BARRA DE APRENDER NOVO RITUAL & LIMITE */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "25px",
                  flexWrap: "wrap",
                  gap: "15px",
                  borderBottom: `1px solid ${colors.border}`,
                  paddingBottom: "15px",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: "14px",
                      color: colors.brand,
                      margin: "0 0 5px 0",
                    }}
                  >
                    SEU GRIMÓRIO
                  </h3>
                  <span
                    style={{
                      fontSize: "12px",
                      color:
                        rituaisSelecionados.length > limiteRituais
                          ? colors.pv
                          : "#aaa",
                    }}
                  >
                    RITUAIS CONHECIDOS:{" "}
                    <strong
                      style={{
                        color:
                          rituaisSelecionados.length > limiteRituais
                            ? colors.pv
                            : colors.brand,
                      }}
                    >
                      {rituaisSelecionados.length} / {limiteRituais}
                    </strong>
                  </span>
                </div>
                <button
                  onClick={() => setIsRitualModalOpen(true)}
                  style={{
                    ...styles.btnStep,
                    padding: "10px 20px",
                    borderColor: colors.brand,
                    color: colors.brand,
                    fontWeight: "bold",
                    background: "rgba(0, 229, 255, 0.1)",
                  }}
                >
                  + EXPLORAR BIBLIOTECA
                </button>
              </div>

              {/* 👇 NOVO: CONTADOR DE RITUAIS 👇 */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                  borderBottom: `1px solid ${colors.border}`,
                  paddingBottom: "10px",
                }}
              >
                <h3
                  style={{ fontSize: "14px", color: colors.brand, margin: 0 }}
                >
                  SEU GRIMÓRIO
                </h3>
                <span
                  style={{
                    fontSize: "12px",
                    color:
                      rituaisSelecionados.length > limiteRituais
                        ? colors.pv
                        : "#aaa",
                  }}
                >
                  RITUAIS CONHECIDOS:{" "}
                  <strong
                    style={{
                      color:
                        rituaisSelecionados.length > limiteRituais
                          ? colors.pv
                          : colors.brand,
                    }}
                  >
                    {rituaisSelecionados.length} / {limiteRituais}
                  </strong>
                </span>
              </div>

              {rituaisSelecionados.length === 0 && (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    border: "1px dashed #333",
                    borderRadius: "10px",
                  }}
                >
                  <p style={{ color: "#444", fontSize: "12px", margin: 0 }}>
                    Seu grimório está vazio. Aprenda rituais acima para poder
                    conjurá-los.
                  </p>
                </div>
              )}

              <div style={styles.tabGrid}>
                {rituaisSelecionados.map((nomeRitual) => {
                  const ritual = rituaisCatalog.find(
                    (r) => r.nome === nomeRitual
                  );
                  if (!ritual) return null;

                  const alvoSelecionado = alvosRituais[ritual.nome] || "self";
                  const versaoSelecionada =
                    versoesRituais[ritual.nome] || "basico";

                  let custoFinal = ritual.custoBase;
                  let textoDescricao = ritual.desc;
                  let corRitual = colors.pe;

                  if (ritual.elemento === "Morte") corRitual = "#9e9e9e";
                  if (ritual.elemento === "Sangue") corRitual = "#ff1744";
                  if (ritual.elemento === "Energia") corRitual = "#00e5ff";
                  if (ritual.elemento === "Conhecimento") corRitual = "#ffd166";
                  if (ritual.elemento === "Medo") corRitual = "#ffffff";

                  if (versaoSelecionada === "discente" && ritual.discente) {
                    custoFinal += ritual.discente.custoExtra;
                    textoDescricao = `${ritual.desc}\n\n[ FORMA DISCENTE ]: ${ritual.discente.desc}`;
                  } else if (
                    versaoSelecionada === "verdadeiro" &&
                    ritual.verdadeiro
                  ) {
                    custoFinal += ritual.verdadeiro.custoExtra;
                    textoDescricao = `${ritual.desc}\n\n[ FORMA VERDADEIRA ]: ${ritual.verdadeiro.desc}`;
                  }

                  return (
                    <div
                      key={ritual.nome}
                      style={{
                        ...styles.summaryCard,
                        borderTop: `3px solid ${corRitual}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          borderBottom: `1px solid ${colors.border}`,
                          paddingBottom: "10px",
                          marginBottom: "10px",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              color: "#fff",
                              margin: "0 0 5px 0",
                              letterSpacing: "1px",
                              fontSize: "14px",
                            }}
                          >
                            {ritual.nome.toUpperCase()}
                          </h3>
                          <div style={{ display: "flex", gap: "5px" }}>
                            <span
                              style={{
                                fontSize: "9px",
                                color: corRitual,
                                border: `1px solid ${corRitual}44`,
                                padding: "2px 6px",
                                borderRadius: "4px",
                              }}
                            >
                              {ritual.elemento.toUpperCase()}
                            </span>
                            <span
                              style={{
                                fontSize: "9px",
                                color: "#aaa",
                                background: "rgba(255,255,255,0.1)",
                                padding: "2px 6px",
                                borderRadius: "4px",
                              }}
                            >
                              CUSTO: {custoFinal} PE
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            setRituaisSelecionados((prev) =>
                              prev.filter((r) => r !== ritual.nome)
                            )
                          }
                          style={{
                            background: "none",
                            border: "none",
                            color: "#666",
                            cursor: "pointer",
                            fontSize: "14px",
                          }}
                          title="Esquecer Ritual"
                        >
                          ✖
                        </button>
                      </div>

                      <div style={{ marginBottom: "10px" }}>
                        <select
                          value={versaoSelecionada}
                          onChange={(e) =>
                            setVersoesRituais({
                              ...versoesRituais,
                              [ritual.nome]: e.target.value,
                            })
                          }
                          style={{
                            ...styles.selectField,
                            padding: "6px",
                            fontSize: "11px",
                            borderColor: "#333",
                            color: "#ddd",
                          }}
                        >
                          <option value="basico">Básico (+0 PE)</option>
                          {ritual.discente && (
                            <option value="discente">
                              Discente (+{ritual.discente.custoExtra} PE)
                            </option>
                          )}
                          {ritual.verdadeiro && (
                            <option value="verdadeiro">
                              Verdadeiro (+{ritual.verdadeiro.custoExtra} PE)
                            </option>
                          )}
                        </select>
                      </div>

                      <p
                        style={{
                          fontSize: "11px",
                          color: "#aaa",
                          lineHeight: 1.6,
                          marginBottom: "15px",
                          whiteSpace:
                            "pre-line" /* 👈 ESSENCIAL PARA O TEXTO NÃO SUMIR */,
                        }}
                      >
                        {textoDescricao}
                      </p>

                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                          flexWrap: "wrap",
                          borderTop: "1px dashed #333",
                          paddingTop: "12px",
                        }}
                      >
                        <select
                          value={alvoSelecionado}
                          onChange={(e) =>
                            setAlvosRituais({
                              ...alvosRituais,
                              [ritual.nome]: e.target.value,
                            })
                          }
                          style={{
                            ...styles.selectField,
                            flex: 2,
                            padding: "8px",
                            fontSize: "11px",
                            minWidth: "120px",
                          }}
                        >
                          <option value="self">Você mesmo</option>
                          {aliadosCampanha.map((aliado) => (
                            <option key={aliado.id} value={aliado.id}>
                              {aliado.nome}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={async () => {
                            if (peAtual >= custoFinal) {
                              setPeAtual((prev) => prev - custoFinal);
                              const nomeAlvo =
                                alvoSelecionado === "self"
                                  ? "a si mesmo"
                                  : aliadosCampanha.find(
                                      (a) => a.id === alvoSelecionado
                                    )?.nome;
                              const textoAcao = `Conjurou ${
                                ritual.nome
                              } (${versaoSelecionada.toUpperCase()}) em ${nomeAlvo}. [-${custoFinal} PE]`;

                              setEfeitoRitual(ritual.elemento);
                              setTimeout(() => setEfeitoRitual(null), 1500); // Remove após 1.5 segundos

                              alert(textoAcao);

                              // 👇 Manda para a Linha do Tempo da mesa 👇
                              await supabase.from("combat_log").insert([
                                {
                                  personagem:
                                    nomePersonagem || user.email.split("@")[0],
                                  acao: textoAcao,
                                  rodada: rodadaAtual,
                                },
                              ]);
                            } else {
                              alert(
                                `Você precisa de ${custoFinal} PE para conjurar a versão ${versaoSelecionada} de ${ritual.nome}.`
                              );
                            }
                          }}
                          style={{
                            ...styles.btnStep,
                            flex: 1,
                            minWidth: "80px",
                            padding: "8px",
                            background: "rgba(197, 160, 0, 0.15)",
                            borderColor: colors.pe,
                            color: colors.pe,
                            fontWeight: "bold",
                          }}
                        >
                          USAR
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {activeTab === "bestiario" && isDM && (
          <div style={styles.container}>
            <div style={styles.statusBox}>
              <h2 style={styles.sectionTitle}>BESTIARIO_A.S.A.</h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "minmax(260px, 0.9fr) 1.4fr",
                  gap: "16px",
                }}
              >
                <div style={{ display: "grid", gap: "10px", alignContent: "start" }}>
                  <select
                    value={selectedBestiary?.id || ""}
                    onChange={(e) => setSelectedBestiaryId(e.target.value)}
                    style={styles.selectField}
                  >
                    {bestiaryEntries.map((monster) => (
                      <option key={monster.id} value={monster.id}>
                        VD {monster.vd || "?"} - {monster.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => addMonsterToCombat(selectedBestiary)}
                    style={{
                      ...styles.btnStep,
                      width: "100%",
                      borderColor: colors.brand,
                      color: colors.brand,
                      padding: "10px",
                    }}
                  >
                    Adicionar selecionado ao combate
                  </button>
                  {selectedBestiary?.custom && (
                    <button
                      onClick={() => removeCustomMonster(selectedBestiary.id)}
                      style={{
                        ...styles.btnStep,
                        width: "100%",
                        borderColor: colors.pv,
                        color: colors.pv,
                        padding: "10px",
                      }}
                    >
                      Remover monstro customizado
                    </button>
                  )}

                  <div
                    style={{
                      ...styles.summaryCard,
                      borderColor: `${colors.brand}33`,
                    }}
                  >
                    <div style={{ color: colors.brand, fontSize: "12px", marginBottom: "8px" }}>
                      AMEACAS CADASTRADAS
                    </div>
                    <div style={{ color: "#d1d5db", fontSize: "12px", lineHeight: 1.6 }}>
                      {asaBestiary.length} do bestiario A.S.A. Tower 2077
                      <br />
                      {customBestiary.length} customizadas neste navegador
                    </div>
                  </div>
                </div>

                {selectedBestiary && (
                  <div style={styles.summaryCard}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        flexWrap: "wrap",
                        borderBottom: `1px solid ${colors.border}`,
                        paddingBottom: "12px",
                        marginBottom: "12px",
                      }}
                    >
                      <div>
                        <h3 style={{ color: "#fff", margin: "0 0 6px 0" }}>
                          {selectedBestiary.name}
                        </h3>
                        <div style={{ color: "#9ca3af", fontSize: "12px" }}>
                          {selectedBestiary.type}
                        </div>
                      </div>
                      <div style={{ color: colors.pe, fontWeight: "bold" }}>
                        VD {selectedBestiary.vd || "?"}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                        gap: "10px",
                        marginBottom: "12px",
                      }}
                    >
                      <div style={{ color: "#d1d5db", fontSize: "12px" }}>
                        <strong style={{ color: colors.brand }}>Defesa:</strong>{" "}
                        {selectedBestiary.defense || "-"}
                      </div>
                      <div style={{ color: "#d1d5db", fontSize: "12px" }}>
                        <strong style={{ color: colors.brand }}>PV:</strong>{" "}
                        {selectedBestiary.hp || "-"}
                      </div>
                      <div style={{ color: "#d1d5db", fontSize: "12px" }}>
                        <strong style={{ color: colors.brand }}>Sentidos:</strong>{" "}
                        {selectedBestiary.senses || "-"}
                      </div>
                    </div>

                    <div style={{ color: "#d1d5db", fontSize: "12px", lineHeight: 1.6 }}>
                      <strong style={{ color: colors.brand }}>Resistencias:</strong>{" "}
                      {selectedBestiary.resistances || "-"}
                      <br />
                      <strong style={{ color: colors.brand }}>Vulnerabilidades:</strong>{" "}
                      {selectedBestiary.vulnerabilities || "-"}
                    </div>

                    {!!selectedBestiary.traits?.length && (
                      <div style={{ marginTop: "14px" }}>
                        <div style={{ color: colors.pe, fontSize: "12px", marginBottom: "8px" }}>
                          TRAÇOS
                        </div>
                        <div style={{ display: "grid", gap: "8px" }}>
                          {selectedBestiary.traits.map((trait, index) => (
                            <div key={index} style={{ color: "#d1d5db", fontSize: "12px" }}>
                              {trait}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!!selectedBestiary.actions?.length && (
                      <div style={{ marginTop: "14px" }}>
                        <div style={{ color: colors.pe, fontSize: "12px", marginBottom: "8px" }}>
                          HABILIDADES
                        </div>
                        <div style={{ display: "grid", gap: "8px" }}>
                          {selectedBestiary.actions.map((action, index) => (
                            <div
                              key={`${action.name}-${index}`}
                              style={{
                                border: `1px solid ${colors.border}`,
                                borderRadius: "8px",
                                padding: "10px",
                              }}
                            >
                              <div style={{ color: "#fff", fontWeight: "bold", fontSize: "12px" }}>
                                {action.type} - {action.name}
                              </div>
                              <div style={{ color: "#aaa", fontSize: "12px", marginTop: "4px" }}>
                                {action.text}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={styles.statusBox}>
              <h2 style={styles.sectionTitle}>ADICIONAR_MONSTRO</h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
                  gap: "10px",
                }}
              >
                <input
                  value={monsterDraft.name}
                  onChange={(e) => updateMonsterDraft("name", e.target.value)}
                  placeholder="Nome"
                  style={styles.selectField}
                />
                <input
                  value={monsterDraft.vd}
                  onChange={(e) => updateMonsterDraft("vd", e.target.value)}
                  placeholder="VD"
                  style={styles.selectField}
                />
                <input
                  value={monsterDraft.type}
                  onChange={(e) => updateMonsterDraft("type", e.target.value)}
                  placeholder="Tipo / papel"
                  style={styles.selectField}
                />
                <input
                  value={monsterDraft.defense}
                  onChange={(e) => updateMonsterDraft("defense", e.target.value)}
                  placeholder="Defesa"
                  style={styles.selectField}
                />
                <input
                  value={monsterDraft.hp}
                  onChange={(e) => updateMonsterDraft("hp", e.target.value)}
                  placeholder="PV"
                  style={styles.selectField}
                />
                <input
                  value={monsterDraft.senses}
                  onChange={(e) => updateMonsterDraft("senses", e.target.value)}
                  placeholder="Sentidos / iniciativa"
                  style={styles.selectField}
                />
                <input
                  value={monsterDraft.resistances}
                  onChange={(e) => updateMonsterDraft("resistances", e.target.value)}
                  placeholder="Resistencias"
                  style={styles.selectField}
                />
                <input
                  value={monsterDraft.vulnerabilities}
                  onChange={(e) => updateMonsterDraft("vulnerabilities", e.target.value)}
                  placeholder="Vulnerabilidades"
                  style={styles.selectField}
                />
                <textarea
                  value={monsterDraft.traitsText}
                  onChange={(e) => updateMonsterDraft("traitsText", e.target.value)}
                  placeholder="Traços, um por linha"
                  rows={5}
                  style={{ ...styles.selectField, resize: "vertical" }}
                />
                <textarea
                  value={monsterDraft.actionsText}
                  onChange={(e) => updateMonsterDraft("actionsText", e.target.value)}
                  placeholder={"Habilidades, uma por linha\nEx: Garra: Teste 3d20+10 | Dano 2d8"}
                  rows={5}
                  style={{ ...styles.selectField, resize: "vertical" }}
                />
              </div>
              <button
                onClick={saveCustomMonster}
                style={{
                  ...styles.btnStep,
                  marginTop: "12px",
                  width: "100%",
                  padding: "12px",
                  borderColor: colors.brand,
                  color: colors.brand,
                }}
              >
                Salvar monstro no bestiario
              </button>
            </div>
          </div>
        )}

        {/* ABA 5: COMBATE / MESA (MÓDULO DO MESTRE) */}
        {/* ABA 5: COMBATE / MESA (MÓDULO DO MESTRE & TIMELINE) */}
        {activeTab === "combate" && (
          <div style={styles.container}>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              {/* PAINEL DE RODADA (ESQUERDA) */}
              <div
                style={{
                  ...styles.statusBox,
                  flex: 1,
                  minWidth: isMobile ? "0" : "300px",
                  textAlign: "center",
                  padding: isMobile ? "20px" : "40px",
                }}
              >
                <h2
                  style={{
                    color: colors.brand,
                    margin: "0 0 10px 0",
                    letterSpacing: "3px",
                  }}
                >
                  MESA DE COMBATE
                </h2>
                <p
                  style={{
                    color: "#666",
                    fontSize: "12px",
                    marginBottom: "30px",
                  }}
                >
                  Sincronização em tempo real
                </p>

                <div
                  style={{
                    marginBottom: "16px",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "10px",
                    padding: "10px",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "8px" }}>
                    MISSÃO ATIVA
                  </div>
                  <div style={{ color: "#fff", fontWeight: "bold", marginBottom: "10px" }}>
                    {selectedMission || "Sem missão selecionada"}
                  </div>
                  <button
                    onClick={async () => {
                      if (alreadyJoinedCombat) return;
                      const activeName = getActiveCharacterName();
                      await emitCombatFlow("JOIN", {
                        userId: user.id,
                        nome: activeName,
                      });
                      await supabase.from("combat_log").insert([
                        {
                          personagem: activeName,
                          acao: "Entrou no combate.",
                          rodada: rodadaAtual,
                        },
                      ]);
                    }}
                    style={{
                      ...styles.btnStep,
                      width: "100%",
                      borderColor: colors.brand,
                      color: colors.brand,
                      opacity: alreadyJoinedCombat ? 0.5 : 1,
                      cursor: alreadyJoinedCombat ? "not-allowed" : "pointer",
                    }}
                    disabled={alreadyJoinedCombat}
                  >
                    {alreadyJoinedCombat ? "Você já entrou no combate" : "Entrar no combate"}
                  </button>
                </div>

                {!!turnOrder.length && (
                  <div
                    style={{
                      marginBottom: "16px",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "10px",
                      padding: "10px",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "8px" }}>
                      TURNO ATUAL
                    </div>
                    <div style={{ color: colors.brand, fontWeight: "bold", marginBottom: "8px" }}>
                      {combatParticipants.find((p) => p.userId === turnOrder[turnIndex])?.nome ||
                        "Aguardando ordem"}
                    </div>
                    {turnOrder.includes(user.id) && (
                      <button
                        onClick={async () => {
                          if (turnDoneBy.includes(user.id)) return;
                          if (turnOrder[turnIndex] !== user.id) return;
                          await emitCombatFlow("TURN_DONE", {
                            userId: user.id,
                            round: rodadaAtual,
                          });
                          await supabase.from("combat_log").insert([
                            {
                              personagem: getActiveCharacterName(),
                              acao: "Finalizou o turno.",
                              rodada: rodadaAtual,
                            },
                          ]);
                        }}
                        disabled={turnOrder[turnIndex] !== user.id || turnDoneBy.includes(user.id)}
                        style={{
                          ...styles.btnStep,
                          width: "100%",
                          borderColor: "#22c55e",
                          color: "#22c55e",
                          opacity:
                            turnOrder[turnIndex] !== user.id || turnDoneBy.includes(user.id)
                              ? 0.5
                              : 1,
                          cursor:
                            turnOrder[turnIndex] !== user.id || turnDoneBy.includes(user.id)
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        {turnDoneBy.includes(user.id)
                          ? "Turno já finalizado"
                          : turnOrder[turnIndex] === user.id
                          ? "Finalizar meu turno"
                          : "Aguardando sua vez"}
                      </button>
                    )}
                    {isDM && turnOrder.length > 0 && turnOrder[turnIndex] !== user.id && (
                      <button
                        onClick={async () => {
                          const currentId = turnOrder[turnIndex];
                          if (!currentId || turnDoneBy.includes(currentId)) return;
                          await emitCombatFlow("TURN_DONE", {
                            userId: currentId,
                            round: rodadaAtual,
                          });
                          const currentName =
                            combatParticipants.find((p) => p.userId === currentId)?.nome ||
                            "Inimigo";
                          await supabase.from("combat_log").insert([
                            {
                              personagem: "SISTEMA A.S.A.",
                              acao: `Mestre encerrou o turno de ${currentName}.`,
                              rodada: rodadaAtual,
                            },
                          ]);
                        }}
                        style={{
                          ...styles.btnStep,
                          width: "100%",
                          marginTop: "8px",
                          borderColor: colors.pe,
                          color: colors.pe,
                        }}
                      >
                        Encerrar turno atual (Mestre)
                      </button>
                    )}
                  </div>
                )}

                {isDM && (
                  <div
                    style={{
                      marginBottom: "20px",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "10px",
                      padding: "10px",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "8px" }}>
                      ORDEM DE TURNO (MESTRE)
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                      <input
                        value={npcNameInput}
                        onChange={(e) => setNpcNameInput(e.target.value)}
                        placeholder="Nome do monstro/NPC"
                        style={{ ...styles.selectField, padding: "8px", flex: 1 }}
                      />
                      <button
                        onClick={async () => {
                          const npcName = npcNameInput.trim();
                          if (!npcName) return;
                          const npcId = `npc:${npcName.toLowerCase().replace(/\s+/g, "-")}:${Date.now()}`;
                          await emitCombatFlow("JOIN", {
                            userId: npcId,
                            nome: npcName,
                          });
                          await supabase.from("combat_log").insert([
                            {
                              personagem: "SISTEMA A.S.A.",
                              acao: `${npcName} entrou no combate.`,
                              rodada: rodadaAtual,
                            },
                          ]);
                          setNpcNameInput("");
                        }}
                        style={{ ...styles.btnStep, whiteSpace: "nowrap" }}
                      >
                        + NPC
                      </button>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "1fr auto",
                        gap: "8px",
                        marginBottom: "10px",
                      }}
                    >
                      <select
                        value={selectedBestiary?.id || ""}
                        onChange={(e) => setSelectedBestiaryId(e.target.value)}
                        style={{ ...styles.selectField, padding: "8px" }}
                      >
                        {bestiaryEntries.map((monster) => (
                          <option key={monster.id} value={monster.id}>
                            VD {monster.vd || "?"} - {monster.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => addMonsterToCombat(selectedBestiary)}
                        style={{
                          ...styles.btnStep,
                          whiteSpace: "nowrap",
                          borderColor: colors.brand,
                          color: colors.brand,
                        }}
                      >
                        + Monstro
                      </button>
                    </div>
                    <div style={{ display: "grid", gap: "8px", marginBottom: "10px" }}>
                      {combatParticipants.map((p) => (
                        <label
                          key={p.userId}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            color: "#d1d5db",
                            fontSize: "12px",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedOrderDraft.includes(p.userId)}
                            onChange={() =>
                              setSelectedOrderDraft((prev) =>
                                prev.includes(p.userId)
                                  ? prev.filter((id) => id !== p.userId)
                                  : [...prev, p.userId]
                              )
                            }
                          />
                          {p.nome}
                        </label>
                      ))}
                    </div>
                    <button
                      onClick={async () => {
                        if (!selectedOrderDraft.length) {
                          alert("Selecione ao menos 1 participante.");
                          return;
                        }
                        await emitCombatFlow("SET_ORDER", {
                          order: selectedOrderDraft,
                        });
                        await supabase.from("combat_log").insert([
                          {
                            personagem: "SISTEMA A.S.A.",
                            acao: `Ordem definida pelo mestre (${selectedOrderDraft.length} participantes).`,
                            rodada: rodadaAtual,
                          },
                        ]);
                      }}
                      style={{
                        ...styles.btnStep,
                        width: "100%",
                        borderColor: colors.brand,
                        color: colors.brand,
                      }}
                    >
                      Definir ordem selecionada
                    </button>
                    <button
                      onClick={resetCombatTable}
                      style={{
                        ...styles.btnStep,
                        width: "100%",
                        marginTop: "8px",
                        borderColor: colors.pv,
                        color: colors.pv,
                      }}
                    >
                      Resetar combate
                    </button>
                  </div>
                )}

                {isDM && combatParticipants.some((p) => p.kind === "monster") && (
                  <div
                    style={{
                      marginBottom: "20px",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "10px",
                      padding: "10px",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "8px" }}>
                      ACOES DE MONSTROS
                    </div>
                    <div style={{ display: "grid", gap: "10px" }}>
                      {combatParticipants
                        .filter((participant) => participant.kind === "monster")
                        .map((participant) => {
                          const monster =
                            participant.monster ||
                            bestiaryEntries.find(
                              (entry) => entry.id === participant.monsterId
                            );
                          return (
                            <div
                              key={participant.userId}
                              style={{
                                border: `1px solid ${colors.border}`,
                                borderRadius: "8px",
                                padding: "10px",
                              }}
                            >
                              <div
                                style={{
                                  color: "#fff",
                                  fontWeight: "bold",
                                  fontSize: "12px",
                                  marginBottom: "8px",
                                }}
                              >
                                {participant.nome}
                              </div>
                              <div style={{ display: "grid", gap: "6px" }}>
                                {(monster?.actions || []).map((action, index) => (
                                  <button
                                    key={`${participant.userId}-${action.name}-${index}`}
                                    onClick={() =>
                                      sendMonsterActionToLog(participant, action)
                                    }
                                    style={{
                                      ...styles.btnStep,
                                      textAlign: "left",
                                      borderColor: colors.brand,
                                      color: "#d1d5db",
                                    }}
                                  >
                                    {action.type} - {action.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                <div
                  style={{
                    display: "inline-block",
                    background: "rgba(0,0,0,0.5)",
                    border: `1px solid ${colors.brand}44`,
                    padding: "30px 50px",
                    borderRadius: "20px",
                    boxShadow: "0 0 40px rgba(0,0,0,0.8)",
                    width: "100%",
                    maxWidth: "250px",
                  }}
                >
                  <div
                    style={{
                      color: "#fff",
                      fontWeight: "bold",
                      letterSpacing: "2px",
                      fontSize: "16px",
                      marginBottom: "10px",
                    }}
                  >
                    RODADA ATUAL
                  </div>
                  <div
                    style={{
                      color: colors.brand,
                      fontSize: "64px",
                      fontWeight: "bold",
                      textShadow: colors.glow,
                    }}
                  >
                    {rodadaAtual}
                  </div>

                  {isDM ? (
                    <button
                      onClick={avancarRodada}
                      style={{
                        ...styles.btnStep,
                        marginTop: "20px",
                        width: "100%",
                        padding: "12px",
                        borderColor: colors.brand,
                        background: `${colors.brand}22`,
                        color: colors.brand,
                        fontWeight: "bold",
                        fontSize: "14px",
                      }}
                    >
                      AVANÇAR RODADA ❯
                    </button>
                  ) : (
                    <div
                      style={{
                        marginTop: "20px",
                        color: colors.pe,
                        fontSize: "12px",
                        background: "rgba(197, 160, 0, 0.1)",
                        border: `1px solid ${colors.pe}`,
                        padding: "8px 12px",
                        borderRadius: "8px",
                      }}
                    >
                      Aguardando o Mestre avançar...
                    </div>
                  )}
                </div>
              </div>

              {/* LINHA DO TEMPO (DIREITA) */}
              <div
                style={{
                  ...styles.statusBox,
                  flex: 2,
                  minWidth: isMobile ? "0" : "300px",
                  padding: "24px",
                }}
              >
                <h3
                  style={{
                    color: colors.brand,
                    marginTop: 0,
                    letterSpacing: "2px",
                    borderBottom: `1px solid ${colors.brand}33`,
                    paddingBottom: "10px",
                  }}
                >
                  LINHA DO TEMPO
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    maxHeight: "400px",
                    overflowY: "auto",
                    paddingRight: "10px",
                  }}
                >
                  {visibleCombatLogs.length === 0 && (
                    <p
                      style={{
                        color: "#666",
                        fontSize: "12px",
                        textAlign: "center",
                        marginTop: "20px",
                      }}
                    >
                      O combate ainda não começou.
                    </p>
                  )}
                  {visibleCombatLogs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        background: "rgba(0,0,0,0.4)",
                        padding: "12px",
                        borderRadius: "8px",
                        borderLeft: log.personagem?.includes("SISTEMA")
                          ? `3px solid ${colors.pe}`
                          : `3px solid ${colors.brand}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "4px",
                        }}
                      >
                        <strong
                          style={{
                            color: log.personagem?.includes("SISTEMA")
                              ? colors.pe
                              : "#fff",
                            fontSize: "13px",
                          }}
                        >
                          {/* 👇 AQUI ESTÁ A CORREÇÃO DO ERRO 👇 */}
                          {(log.personagem || "Desconhecido").toUpperCase()}
                        </strong>
                        <span style={{ fontSize: "10px", color: "#666" }}>
                          RODADA {log.rodada}
                        </span>
                      </div>
                      <div
                        style={{
                          color: "#aaa",
                          fontSize: "12px",
                          lineHeight: 1.5,
                        }}
                      >
                        {log.acao}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* ABA 6: INVENTÁRIO */}
        {activeTab === "inventario" && (
          <div style={styles.container}>
            <div style={styles.statusBox}>
              <h2 style={styles.sectionTitle}>MÓDULO_DE_INVENTÁRIO</h2>

              {/* CARD DE PRESTÍGIO E PATENTE */}
              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    ...styles.summaryCard,
                    flex: 1,
                    textAlign: "center",
                  }}
                >
                  <div style={{ ...styles.attrLabel, marginBottom: "10px" }}>
                    PONTOS DE PRESTÍGIO
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <button
                      style={styles.btnStep}
                      onClick={() => setPrestigio((p) => Math.max(0, p - 5))}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={prestigio}
                      onChange={(e) =>
                        setPrestigio(Number(e.target.value) || 0)
                      }
                      style={{ ...styles.inputField, width: "60px" }}
                    />
                    <button
                      style={styles.btnStep}
                      onClick={() => setPrestigio((p) => p + 5)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    ...styles.summaryCard,
                    flex: 2,
                    display: "flex",
                    justifyContent: "space-around",
                    alignItems: "center",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div style={styles.attrLabel}>PATENTE</div>
                    <div
                      style={{
                        color: colors.brand,
                        fontSize: "18px",
                        fontWeight: "bold",
                      }}
                    >
                      {patenteInfo.nome.toUpperCase()}
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: "center",
                      borderLeft: "1px solid #333",
                      paddingLeft: "20px",
                    }}
                  >
                    <div style={styles.attrLabel}>CRÉDITO</div>
                    <div style={{ color: "#fff", fontSize: "16px" }}>
                      {patenteInfo.credito.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD DE CARGA E LIMITES */}
              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ ...styles.summaryCard, flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "5px",
                    }}
                  >
                    <span style={styles.attrLabel}>CARGA ATUAL</span>
                    <span
                      style={{
                        color: cargaAtual > cargaMaxima ? colors.pv : "#fff",
                        fontWeight: "bold",
                      }}
                    >
                      {cargaAtual} / {cargaMaxima}
                    </span>
                  </div>
                  <div
                    style={{
                      height: "10px",
                      background: "#000",
                      border: "1px solid #222",
                      borderRadius: "5px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(
                          (cargaAtual / Math.max(cargaMaxima, 1)) * 100,
                          100
                        )}%`,
                        background:
                          cargaAtual > cargaMaxima ? colors.pv : colors.brand,
                        transition: "0.3s",
                      }}
                    />
                  </div>
                  {isTecnico && (
                    <div
                      style={{
                        fontSize: "10px",
                        color: colors.pe,
                        marginTop: "8px",
                      }}
                    >
                      *Habilidade Inventário Otimizado (Técnico) ativa.
                    </div>
                  )}
                </div>

                <div style={{ ...styles.summaryCard, flex: 1 }}>
                  <div
                    style={{
                      ...styles.attrLabel,
                      marginBottom: "8px",
                      textAlign: "center",
                    }}
                  >
                    LIMITES DA PATENTE
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-around" }}
                  >
                    {["I", "II", "III", "IV"].map((cat) => {
                      const limite = patenteInfo.limite[cat];
                      const usado = categoriasUsadas[cat];
                      const estourou = usado > limite;
                      return (
                        <div key={cat} style={{ textAlign: "center" }}>
                          <div
                            style={{
                              color: "#fff",
                              fontWeight: "bold",
                              fontSize: "14px",
                            }}
                          >
                            CAT {cat}
                          </div>
                          <div
                            style={{
                              color: estourou ? colors.pv : "#aaa",
                              fontSize: "12px",
                            }}
                          >
                            {usado} /{" "}
                            {limite === 0 &&
                            patenteInfo.nome !== "Agente Especial"
                              ? "0"
                              : limite}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 👇 CARD DE ADICIONAR ITEM (AUTOMÁTICO + MANUAL) 👇 */}
              <div style={{ ...styles.summaryCard, marginBottom: "20px" }}>
                <div
                  style={{
                    ...styles.attrLabel,
                    marginBottom: "10px",
                    color: colors.brand,
                  }}
                >
                  ARSENAL DA ORDEM (ADICIONAR ITEM)
                </div>

                {/* SELECT INTELIGENTE */}
                <select
                  onChange={(e) => {
                    const selected = itemsCatalog.find(
                      (i) => i.nome === e.target.value
                    );
                    if (selected) {
                      setItemBaseSelecionado(selected);
                      setModsSelecionadas([]);
                      setMaldicoesSelecionadas([]);
                    }
                  }}
                  style={{
                    ...styles.selectField,
                    marginBottom: "15px",
                    borderColor: "#444",
                    color: "#ddd",
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Escolha um item do livro ou crie um customizado abaixo...
                  </option>
                  {[
                    "Armas Corpo a Corpo",
                    "Armas de Disparo",
                    "Armas de Fogo",
                    "Armas Pesadas",
                    "Proteção",
                    "Explosivos",
                    "Acessórios",
                    "Munição",
                    "Itens Operacionais",
                    "Itens Paranormais",
                  ].map((grupo) => (
                    <optgroup
                      key={grupo}
                      label={grupo}
                      style={{ color: colors.brand }}
                    >
                      {itemsCatalog
                        .filter((i) => i.grupo === grupo)
                        .map((item) => (
                          <option
                            key={item.nome}
                            value={item.nome}
                            style={{ color: "#fff" }}
                          >
                            {item.nome} (Cat{" "}
                            {item.cat === 0
                              ? "0"
                              : item.cat === 1
                              ? "I"
                              : item.cat === 2
                              ? "II"
                              : item.cat === 3
                              ? "III"
                              : "IV"}{" "}
                            | {item.espacos} Espaços)
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginBottom: "10px",
                  }}
                >
                  <input
                    placeholder="Nome do item"
                    value={previewItem?.nome || ""}
                    readOnly
                    style={{
                      ...styles.selectField,
                      flex: 3,
                      minWidth: "150px",
                      opacity: 0.8,
                    }}
                  />
                  <select
                    value={previewItem?.cat ?? 0}
                    disabled
                    style={{
                      ...styles.selectField,
                      flex: 1,
                      minWidth: "90px",
                      opacity: 0.8,
                    }}
                  >
                    <option value={0}>Cat 0</option>
                    <option value={1}>Cat I</option>
                    <option value={2}>Cat II</option>
                    <option value={3}>Cat III</option>
                    <option value={4}>Cat IV</option>
                  </select>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: "#000",
                      border: `1px solid ${colors.brand}33`,
                      borderRadius: "8px",
                      padding: "0 10px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#666",
                        marginRight: "5px",
                      }}
                    >
                      ESPAÇOS:
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={previewItem?.espacos ?? 0}
                      readOnly
                      style={{
                        background: "none",
                        border: "none",
                        color: "#fff",
                        width: "35px",
                        outline: "none",
                        textAlign: "center",
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginBottom: "15px",
                  }}
                >
                  <input
                    placeholder="Dano (ex: 1d10)"
                    value={previewItem?.dano || ""}
                    readOnly
                    style={{
                      ...styles.selectField,
                      flex: 1,
                      minWidth: "100px",
                      opacity: 0.8,
                    }}
                  />
                  <input
                    placeholder="Crítico (ex: 19)"
                    value={previewItem?.critico || ""}
                    readOnly
                    style={{
                      ...styles.selectField,
                      flex: 1,
                      minWidth: "100px",
                      opacity: 0.8,
                    }}
                  />
                  <input
                    placeholder="Alcance/Tipo"
                    value={
                      [previewItem?.alcance, previewItem?.tipo]
                        .filter(Boolean)
                        .join(" / ")
                    }
                    readOnly
                    style={{
                      ...styles.selectField,
                      flex: 1,
                      minWidth: "100px",
                      opacity: 0.8,
                    }}
                  />
                </div>
                <textarea
                  ref={itemDescRef}
                  placeholder="Descrição ou Efeito Específico (Opcional)"
                  value={previewItem?.desc || ""}
                  readOnly
                  rows={3}
                  onInput={(e) => {
                    e.currentTarget.style.height = "auto";
                    e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                  }}
                  style={{
                    ...styles.selectField,
                    marginBottom: "15px",
                    minHeight: "90px",
                    resize: "none",
                    overflow: "hidden",
                    opacity: 0.9,
                  }}
                />
                {modsDisponiveis.length > 0 && (
                  <div
                    style={{
                      border: "1px solid #2a2a2a",
                      borderRadius: "10px",
                      padding: "12px",
                      marginBottom: "15px",
                      background: "rgba(0,0,0,0.25)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        color: colors.brand,
                        marginBottom: "8px",
                        letterSpacing: "1px",
                      }}
                    >
                      MODIFICAÇÕES DISPONÍVEIS (CADA UMA +1 CATEGORIA)
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {modsDisponiveis.map((mod) => {
                        const checked = modsSelecionadas.includes(mod);
                        return (
                          <label
                            key={mod}
                            style={{
                              border: `1px solid ${checked ? colors.brand : "#333"}`,
                              background: checked
                                ? "rgba(0,229,255,0.1)"
                                : "rgba(0,0,0,0.2)",
                              borderRadius: "999px",
                              padding: "6px 10px",
                              fontSize: "11px",
                              cursor: "pointer",
                              userSelect: "none",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setModsSelecionadas((prev) =>
                                  prev.includes(mod)
                                    ? prev.filter((m) => m !== mod)
                                    : [...prev, mod]
                                );
                              }}
                              style={{ marginRight: "6px" }}
                            />
                            {mod}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openInfoModal(
                                  "mod",
                                  modsDisponiveis,
                                  modsDisponiveis.indexOf(mod)
                                );
                              }}
                              style={{
                                marginLeft: "8px",
                                background: "none",
                                border: `1px solid ${colors.brand}88`,
                                color: colors.brand,
                                borderRadius: "999px",
                                fontSize: "10px",
                                padding: "1px 6px",
                                cursor: "pointer",
                              }}
                            >
                              i
                            </button>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
                {maldicoesDisponiveis.length > 0 && (
                  <div
                    style={{
                      border: "1px solid #3a233f",
                      borderRadius: "10px",
                      padding: "12px",
                      marginBottom: "15px",
                      background: "rgba(54,20,66,0.2)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#d593ff",
                        marginBottom: "8px",
                        letterSpacing: "1px",
                      }}
                    >
                      MALDIÇÕES DE ARMA (1ª +II, DEMAIS +I)
                    </div>
                    {!canUseCursedItems && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#ff9aa2",
                          marginBottom: "8px",
                        }}
                      >
                        Itens amaldiçoados só são liberados para Agente
                        Especial, Oficial de Operações e Agente de Elite.
                      </div>
                    )}
                    {canUseCursedItems && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#c9b4d6",
                          marginBottom: "8px",
                          lineHeight: 1.4,
                          whiteSpace: "pre-line",
                        }}
                      >
                        {"Regra: 1ª maldição aumenta categoria em +II, demais em +I.\nNão é permitido combinar elementos opressores.\nCusto de Sanidade: Conhecimento (falhas em Intelecto), Energia (Agilidade), Morte (Presença), Sangue (Força/Vigor): -2 SAN por maldição do elemento."}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {maldicoesDisponiveis.map((curse) => {
                        const checked = maldicoesSelecionadas.includes(curse);
                        const element = CURSE_ELEMENT[curse];
                        return (
                          <label
                            key={curse}
                            style={{
                              border: `1px solid ${checked ? "#d593ff" : "#4a3554"}`,
                              background: checked
                                ? "rgba(213,147,255,0.15)"
                                : "rgba(0,0,0,0.2)",
                              borderRadius: "999px",
                              padding: "6px 10px",
                              fontSize: "11px",
                              cursor: "pointer",
                              userSelect: "none",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!canUseCursedItems}
                              onChange={() => {
                                if (!canUseCursedItems) return;
                                if (
                                  curse === "Empuxo" &&
                                  itemBaseSelecionado?.grupo !== "Armas Corpo a Corpo"
                                ) {
                                  alert("Empuxo só pode ser aplicada em armas corpo a corpo.");
                                  return;
                                }
                                setMaldicoesSelecionadas((prev) =>
                                  prev.includes(curse)
                                    ? prev.filter((c) => c !== curse)
                                    : (() => {
                                        const nextElements = prev.map(
                                          (c) => CURSE_ELEMENT[c]
                                        );
                                        const hasOppressor = nextElements.some(
                                          (el) =>
                                            OPPRESSOR_ELEMENTS[el] === element ||
                                            OPPRESSOR_ELEMENTS[element] === el
                                        );
                                        if (hasOppressor) {
                                          alert(
                                            "Não é permitido combinar maldições de elementos opressores."
                                          );
                                          return prev;
                                        }
                                        return [...prev, curse];
                                      })()
                                );
                              }}
                              style={{ marginRight: "6px" }}
                            />
                            {curse}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openInfoModal(
                                  "curse",
                                  maldicoesDisponiveis,
                                  maldicoesDisponiveis.indexOf(curse)
                                );
                              }}
                              style={{
                                marginLeft: "8px",
                                background: "none",
                                border: "1px solid #d593ff88",
                                color: "#d593ff",
                                borderRadius: "999px",
                                fontSize: "10px",
                                padding: "1px 6px",
                                cursor: "pointer",
                              }}
                            >
                              i
                            </button>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  disabled={!itemBaseSelecionado}
                  onClick={() => {
                    if (!itemBaseSelecionado || !previewItem) {
                      alert("Selecione um item do livro para adicionar.");
                      return;
                    }
                    const itemFinal = {
                      id: Date.now(),
                      ...previewItem,
                    };

                    setInventario([
                      itemFinal,
                      ...inventario,
                    ]);
                    // Limpar campos após adicionar
                    setItemBaseSelecionado(null);
                    setModsSelecionadas([]);
                    setMaldicoesSelecionadas([]);
                  }}
                  style={{
                    ...styles.btnStep,
                    width: "100%",
                    background: "rgba(0, 229, 255, 0.1)",
                    borderColor: colors.brand,
                    color: colors.brand,
                    fontWeight: "bold",
                    padding: "12px",
                    opacity: itemBaseSelecionado ? 1 : 0.5,
                    cursor: itemBaseSelecionado ? "pointer" : "not-allowed",
                  }}
                >
                  + ADICIONAR À MOCHILA
                </button>
              </div>

              {/* 👇 LISTA DE ITENS COM DETALHES 👇 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {inventario.length === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#666",
                      padding: "30px",
                      border: "1px dashed #333",
                      borderRadius: "10px",
                    }}
                  >
                    A mochila está vazia. Solicite equipamentos para a Ordem.
                  </div>
                )}
                {inventario.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      ...styles.summaryCard,
                      borderLeft: `4px solid ${
                        item.cat > 0 ? colors.pe : "#444"
                      }`,
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <strong
                        style={{
                          color: "#fff",
                          fontSize: "15px",
                          letterSpacing: "1px",
                        }}
                      >
                        {item.nome.toUpperCase()}
                      </strong>
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontSize: "11px", color: "#aaa" }}>
                          CAT{" "}
                          {item.cat === 0
                            ? "0"
                            : item.cat === 1
                            ? "I"
                            : item.cat === 2
                            ? "II"
                            : item.cat === 3
                            ? "III"
                            : "IV"}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#aaa",
                            background: "#111",
                            padding: "2px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          {item.espacos} ESPAÇO{item.espacos !== 1 ? "S" : ""}
                        </span>
                        <button
                          onClick={() =>
                            setInventario(
                              inventario.filter((i) => i.id !== item.id)
                            )
                          }
                          style={{
                            background: "none",
                            border: "none",
                            color: colors.pv,
                            cursor: "pointer",
                            fontSize: "14px",
                          }}
                          title="Descartar Item"
                        >
                          ✖
                        </button>
                      </div>
                    </div>
                    {Array.isArray(item.modificacoes) &&
                      item.modificacoes.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            flexWrap: "wrap",
                            marginTop: "8px",
                          }}
                        >
                          {item.modificacoes.map((mod) => (
                            <span
                              key={`${item.id}-mod-${mod}`}
                              style={{
                                fontSize: "10px",
                                border: `1px solid ${colors.brand}66`,
                                color: colors.brand,
                                borderRadius: "999px",
                                padding: "2px 8px",
                                background: "rgba(0,229,255,0.08)",
                              }}
                            >
                              MOD: {mod}
                            </span>
                          ))}
                        </div>
                      )}
                    {Array.isArray(item.maldicoes) &&
                      item.maldicoes.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            flexWrap: "wrap",
                            marginTop: "6px",
                          }}
                        >
                          {item.maldicoes.map((curse) => {
                            const element = CURSE_ELEMENT[curse];
                            const elementColor = ELEMENT_COLORS[element] || "#d593ff";
                            return (
                              <span
                                key={`${item.id}-curse-${curse}`}
                                style={{
                                  fontSize: "10px",
                                  border: `1px solid ${elementColor}99`,
                                  color: elementColor,
                                  borderRadius: "999px",
                                  padding: "2px 8px",
                                  background: "rgba(255,255,255,0.03)",
                                }}
                              >
                                MALDIÇÃO: {curse}
                                {element ? ` (${element})` : ""}
                              </span>
                            );
                          })}
                        </div>
                      )}

                    {/* Exibe o Painel de Detalhes de Combate/Uso se a arma/item tiver informações preenchidas */}
                    {(item.dano ||
                      item.critico ||
                      item.alcance ||
                      item.desc) && (
                      <div
                        style={{
                          background: "rgba(0,0,0,0.3)",
                          padding: "10px",
                          borderRadius: "6px",
                        }}
                      >
                        {(item.dano || item.critico || item.alcance) && (
                          <div
                            style={{
                              display: "flex",
                              gap: "15px",
                              flexWrap: "wrap",
                              marginBottom: item.desc ? "8px" : "0",
                              fontSize: "12px",
                            }}
                          >
                            {item.dano && (
                              <span style={{ color: colors.pv }}>
                                ⚔️ <strong>DANO:</strong> {item.dano}
                              </span>
                            )}
                            {item.critico && (
                              <span style={{ color: "#ffd166" }}>
                                🎯 <strong>CRÍTICO:</strong> {item.critico}
                              </span>
                            )}
                            {item.alcance && (
                              <span style={{ color: "#00e5ff" }}>
                                📍 <strong>ALCANCE/TIPO:</strong> {item.alcance}
                              </span>
                            )}
                          </div>
                        )}
                        {item.desc && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#aaa",
                              lineHeight: 1.5,
                              whiteSpace: "pre-line",
                              borderTop:
                                item.dano || item.critico
                                  ? "1px dashed #333"
                                  : "none",
                              paddingTop:
                                item.dano || item.critico ? "6px" : "0",
                            }}
                          >
                            {item.desc}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {activeTab === "admin" && isDM && (
          <div style={styles.container}>
            <div style={styles.statusBox}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginBottom: "18px",
                }}
              >
                <h2 style={styles.sectionTitle}>PAINEL_ADMIN</h2>
                <button
                  onClick={loadAdminPanelData}
                  style={{ ...styles.btnStep, borderColor: colors.brand, color: colors.brand }}
                >
                  Atualizar
                </button>
              </div>

              {adminLoading && (
                <div style={{ color: colors.muted, marginBottom: "14px" }}>
                  Carregando dados administrativos...
                </div>
              )}

              <div style={{ ...styles.tabGrid, marginBottom: "18px" }}>
                {adminProfiles.map((profile) => {
                  const chars = adminCharacters.filter((c) => c.owner_id === profile.id);
                  return (
                    <div key={profile.id} style={styles.summaryCard}>
                      <div style={{ color: "#fff", fontWeight: "bold", marginBottom: "6px" }}>
                        {(profile.nome_personagem || profile.email || "Sem nome").toUpperCase()}
                      </div>
                      <div style={{ color: colors.muted, fontSize: "12px", marginBottom: "10px" }}>
                        {profile.email || profile.id}
                      </div>
                      <label style={{ display: "grid", gap: "6px", marginBottom: "12px" }}>
                        <span style={styles.attrLabel}>ROLE</span>
                        <select
                          value={normalizeRole(profile.role)}
                          onChange={(e) => updateProfileRole(profile.id, e.target.value)}
                          style={styles.selectField}
                          disabled={!isAdmin}
                        >
                          <option value="player">player</option>
                          <option value="dm">dm</option>
                          <option value="admin">admin</option>
                        </select>
                      </label>
                      <div style={{ ...styles.attrLabel, marginBottom: "8px" }}>
                        PERSONAGENS ({chars.length})
                      </div>
                      <div style={{ display: "grid", gap: "8px" }}>
                        {chars.length === 0 && (
                          <div style={{ color: "#666", fontSize: "12px" }}>
                            Nenhum personagem salvo no Supabase.
                          </div>
                        )}
                        {chars.map((char) => {
                          const sheet = char.sheet_json || {};
                          return (
                            <div
                              key={char.id}
                              style={{
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: "8px",
                                padding: "10px",
                                background: "rgba(0,0,0,0.28)",
                              }}
                            >
                              <div style={{ color: colors.brand, fontWeight: "bold" }}>
                                {char.name}
                              </div>
                              <div style={{ color: "#aaa", fontSize: "12px", lineHeight: 1.6 }}>
                                NEX {sheet.nex || 5}% | {sheet.classe || "Classe indefinida"} | {sheet.trilha || "Trilha indefinida"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {infoModal && (
          <div
            onClick={() => setInfoModal(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.68)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "16px",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "min(760px, 95vw)",
                maxHeight: "80vh",
                overflowY: "auto",
                background: "#0f1016",
                border: `1px solid ${colors.brand}55`,
                borderRadius: "12px",
                padding: "16px",
                boxShadow: colors.glow,
              }}
            >
              {(() => {
                const entry = getInfoEntry(infoModal);
                if (!entry) return null;
                return (
                  <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <strong style={{ color: colors.brand }}>{entry.title}</strong>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() =>
                      setInfoModal((prev) => ({
                        ...prev,
                        index:
                          (prev.index - 1 + prev.keys.length) % prev.keys.length,
                      }))
                    }
                    style={{
                      background: "none",
                      border: "1px solid #444",
                      color: "#ddd",
                      borderRadius: "8px",
                      padding: "4px 8px",
                      cursor: "pointer",
                    }}
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setInfoModal((prev) => ({
                        ...prev,
                        index: (prev.index + 1) % prev.keys.length,
                      }))
                    }
                    style={{
                      background: "none",
                      border: "1px solid #444",
                      color: "#ddd",
                      borderRadius: "8px",
                      padding: "4px 8px",
                      cursor: "pointer",
                    }}
                  >
                    Próxima
                  </button>
                  <button
                    type="button"
                    onClick={() => setInfoModal(null)}
                    style={{
                      background: "none",
                      border: "1px solid #444",
                      color: "#ddd",
                      borderRadius: "8px",
                      padding: "4px 8px",
                      cursor: "pointer",
                    }}
                  >
                    Fechar
                  </button>
                </div>
              </div>
              <div
                style={{
                  color: "#ddd",
                  fontSize: "13px",
                  lineHeight: 1.6,
                  whiteSpace: "pre-line",
                }}
              >
                {entry.text}
              </div>
              </>
                );
              })()}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  const [authFeedback, setAuthFeedback] = useState(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hashRaw = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const hashParams = new URLSearchParams(hashRaw);

    const authParam = searchParams.get("auth");
    const errorDescription =
      searchParams.get("error_description") ||
      hashParams.get("error_description") ||
      searchParams.get("error") ||
      hashParams.get("error");
    const hashType = hashParams.get("type");
    const hasSessionToken =
      Boolean(hashParams.get("access_token")) ||
      Boolean(hashParams.get("refresh_token"));

    let feedback = null;

    if (errorDescription) {
      feedback = {
        type: "error",
        title: "Falha na confirmação",
        text: decodeURIComponent(errorDescription).replace(/\+/g, " "),
      };
    } else if (authParam === "confirmed" || (hashType === "signup" && hasSessionToken)) {
      feedback = {
        type: "success",
        title: "E-mail confirmado",
        text: "Sua conta foi confirmada com sucesso. Você já pode entrar no sistema.",
      };
    } else if (authParam === "reset") {
      feedback = {
        type: "info",
        title: "Recuperação de senha",
        text: "Link de recuperação validado. Defina sua nova senha para concluir.",
      };
    }

    if (feedback) {
      setAuthFeedback(feedback);
      const cleanUrl = `${window.location.origin}${window.location.pathname}`;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  if (loading)
    return (
      <div
        style={{
          color: colors.brand,
          padding: "40px",
          textAlign: "center",
          fontFamily: "monospace",
        }}
      >
        Conectando ao terminal A.S.A...
      </div>
    );

  if (authFeedback) {
    const accent =
      authFeedback.type === "error"
        ? "#ff4d4f"
        : authFeedback.type === "info"
        ? "#ffd166"
        : colors.brand;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: colors.background,
          color: colors.text,
        }}
      >
        <div
          style={{
            width: "min(560px, 95vw)",
            border: `1px solid ${accent}66`,
            boxShadow: "0 0 24px rgba(0,0,0,0.45)",
            borderRadius: "14px",
            background: "rgba(17, 17, 21, 0.96)",
            padding: "20px",
            fontFamily: "monospace",
          }}
        >
          <h2 style={{ margin: "0 0 10px", color: accent }}>{authFeedback.title}</h2>
          <p style={{ margin: "0 0 16px", lineHeight: 1.55 }}>{authFeedback.text}</p>
          <button
            type="button"
            onClick={() => setAuthFeedback(null)}
            style={{
              border: `1px solid ${accent}66`,
              background: "transparent",
              color: "#fff",
              borderRadius: "10px",
              padding: "10px 14px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return <AppContent key={user.id} />;
}














