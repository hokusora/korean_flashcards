// ============================================================
//  K-VOCAB STUDY LAB — App.jsx (PHIÊN BẢN HOÀN CHỈNH + NOTEBOOK NOTE)
//  + Tích hợp Personalization Panel (Floating Settings)
//  + Điều khiển màu sắc & font chữ toàn bộ app qua CSS Variables
//  + Giữ nguyên mọi chức năng: sign-in, database, checklist, study, edit, v.v.
//  + BỔ SUNG: Khung "Ghi chú / Ví dụ" dạng Notebook có scroll, hỗ trợ **bold**, *italic*
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import {
  Plus,
  Trash2,
  ArrowLeft,
  BookOpen,
  RotateCcw,
  ArrowRight,
  Save,
  Check,
  X,
  LogOut,
  Sparkles,
  CheckSquare,
  Loader2,
  Paintbrush,
  Settings,
  Palette,
} from "lucide-react";
import axios from "axios";

// ==========================================
// VỊ TRÍ 1: ICON HOA ANH ĐÀO
// Đặt biến SVG_TEMPLATE này ở bên ngoài hàm App()
// ==========================================
// 1. Hãy thêm dòng import file ảnh này lên trên cùng file App.jsx (nằm cùng cụm với các dòng import lucide-react hay axios)
import snowflakeIcon from "./assets/icons/snowflake.png";

// 2. Thay đổi hằng số biến mẫu thành thẻ img như dưới đây
const SVG_TEMPLATE = (
  <img
    src={snowflakeIcon}
    alt="snowflake"
    style={{
      width: "100%",
      height: "100%",
      objectFit: "contain",
    }}
  />
);

// ────────────────────────────────────────────────────────────
//  ENDPOINT API — thay URL nếu bạn đổi backend
// ────────────────────────────────────────────────────────────
const API_URL = "https://flashcard-backend-aa18.onrender.com/api/decks";

// ════════════════════════════════════════════════════════════
//  CSS GLOBAL + CSS VARIABLES (màu mặc định - Pink Dream)
//  BỔ SUNG: biến cho khung note dạng Notebook
// ════════════════════════════════════════════════════════════
const GLOBAL_STYLE = `
  :root {
    /* 🎨 CUSTOM VARIABLE — NỀN TRANG (gradient 3 màu) */
    --bg-gradient-from: #fbcfe8;     /* pink-200 */
    --bg-gradient-via:  #f3e8ff;     /* purple-50 */
    --bg-gradient-to:   #e0e7ff;     /* indigo-100 */

    /* 🎨 BUBBLE GRADIENT (theo chuột) */
    --bubble-gradient-start: rgba(255, 194, 203, 0.78);
    --bubble-gradient-mid:   rgba(196,181,253,0.2);
    --bubble-gradient-end:   transparent;

    /* 🎨 HEADER BAR */
    --header-bg:          rgba(255,255,255,0.45);
    --header-border:      rgba(255,255,255,0.5);
    --header-logo-grad-from: #ff8cc6;
    --header-logo-grad-to:   #c88eff;

    /* 🎨 DECK CARD (bộ từ vựng) */
    --deck-card-bg:       rgba(255,255,255,0.42);
    --deck-card-border:   rgba(255,255,255,0.4);
    --deck-title-color:   #111827;
    --deck-title-hover:   #a984ff;
    --deck-stats-bg:      rgba(255,255,255,0.4);
    --deck-stats-text:    #fd75b9;
    --deck-button-bg:     rgba(255,255,255,0.7);
    --deck-button-hover:  #c286fa;

    /* 🎨 FLASHCARD MẶT TRƯỚC (tiếng Hàn) */
    --flashcard-front-bg:        rgba(255,255,255,0.65);
    --flashcard-front-text:      #c894f8;
    --flashcard-front-romaji:    #9ca3af;

    /* 🎨 FLASHCARD MẶT SAU (tiếng Việt) */
    --flashcard-back-bg:         linear-gradient(135deg, #fff0f8 0%, #ede9fe 100%);
    --flashcard-back-text:       #111827;
    --flashcard-back-romaji:     #a855f7;
    --flashcard-back-note-bg:    rgba(255,255,255,0.6);
    --flashcard-back-note-text:  #4b5563;

    /* 🎨 KHUNG NOTE KIỂU NOTEBOOK (mới) */
    --notebook-bg:               rgba(255,245,250,0.85);
    --notebook-border:           rgba(255,200,220,0.6);
    --notebook-text:             #4a1d6d;
    --notebook-scrollbar-thumb:  #f9a8d4;
    --notebook-scrollbar-track:  #ffe4f0;

    /* 🎨 NÚT MŨI TÊN & RESET */
    --nav-button-bg:       white;
    --nav-button-hover:    #f5f3ff;
    --nav-button-text:     #757bff;
    --nav-button-disabled-opacity: 0.3;

    /* 🎨 NÚT CHECKLIST "Đã học" */
    --checklist-button-bg:     #dcfce7;
    --checklist-button-hover:  #bbf7d0;
    --checklist-button-text:   #16a34a;
    --checklist-button-border: #bbf7d0;

    /* 🎨 FORM EDIT & DANH SÁCH TỪ */
    --edit-form-bg:        rgba(255,255,255,0.5);
    --edit-input-bg:       rgba(255,255,255,0.8);
    --edit-input-focus:    #a855f7;
    --edit-card-bg:        rgba(255,255,255,0.48);
    --edit-card-korean:    #581c87;
    --edit-card-viet:      #1f2937;
    --edit-card-romaji:    #9ca3af;
    --edit-card-note-bg:   rgba(255,255,255,0.5);
    --edit-delete-icon:    #9ca3af;
    --edit-delete-icon-hover: #ef4444;

    /* 🎨 WELCOME MODAL */
    --modal-bg:            rgba(255,255,255,0.55);
    --modal-title:         #f95caa;
    --modal-button-grad-from: #f472b6;
    --modal-button-grad-to:   #c38af8;
    --modal-button-secondary-bg: rgba(255,255,255,0.6);
  }

  /* Font chữ mặc định (có thể đổi qua settings) */
  body {
    font-family: var(--font-family-body, "ZFangelring", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  }
  h1, h2, h3, .font-title {
    font-family: var(--font-family-title, "SVN-Busan Garden", sans-serif) !important;
  }

  /* Các lớp cũ giữ nguyên */
  .glass {
    background: rgba(255, 255, 255, 0.45);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
  }
  .perspective-1000 { perspective: 1200px; }
  .transform-style-3d { transform-style: preserve-3d; }
  .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
  .rotate-y-180 { transform: rotateY(180deg); }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in { animation: fadeIn 0.4s ease both; }
  @keyframes floatUp {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-4px); }
  }

  /* ========== KIỂU NOTEBOOK CHO GHI CHÚ (scroll, glass, pastel) ========== */
  .notebook-note {
    background: var(--notebook-bg);
    backdrop-filter: blur(12px);
    border: 1px solid var(--notebook-border);
    border-radius: 1.5rem;
    padding: 1rem 1.25rem;
    max-height: 180px;
    overflow-y: auto;
    font-size: 0.9rem;
    line-height: 1.6;
    color: var(--notebook-text);
    text-align: left;
    white-space: pre-wrap;
    word-break: break-word;
    scrollbar-width: thin;
    scrollbar-color: var(--notebook-scrollbar-thumb) var(--notebook-scrollbar-track);
  }
  .notebook-note::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }
  .notebook-note::-webkit-scrollbar-track {
    background: var(--notebook-scrollbar-track);
    border-radius: 10px;
  }
  .notebook-note::-webkit-scrollbar-thumb {
    background: var(--notebook-scrollbar-thumb);
    border-radius: 10px;
  }
  .notebook-note strong {
    color: #ee3488;
    font-weight: 700;
  }
  .notebook-note em {
    color: #9268f2;
    font-style: italic;
  }
`;

// Inject global style (chỉ 1 lần)
if (
  typeof document !== "undefined" &&
  !document.getElementById("kvocab-style")
) {
  const styleTag = document.createElement("style");
  styleTag.id = "kvocab-style";
  styleTag.textContent = GLOBAL_STYLE;
  document.head.appendChild(styleTag);
}

// ════════════════════════════════════════════════════════════
//  HÀM TIỆN ÍCH: Render markdown đơn giản (**bold**, *italic*)
// ════════════════════════════════════════════════════════════
const renderSimpleMarkdown = (text) => {
  if (!text) return null;
  // Tạm thời chuyển đổi **bold** và *italic* nhưng không ảnh hưởng HTML khác
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    } else if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={idx}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
};

// ════════════════════════════════════════════════════════════
//  COMPONENT CHÍNH
// ════════════════════════════════════════════════════════════
export default function App() {
  // ── STATE DỮ LIỆU (giữ nguyên) ───────────────────────────
  const [decks, setDecks] = useState([]);
  const [currentView, setCurrentView] = useState("home");
  const [activeDeckId, setActiveDeckId] = useState(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [showWelcome, setShowWelcome] = useState(true);
  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [newCard, setNewCard] = useState({
    korean: "",
    romaji: "",
    viet: "",
    note: "",
  });
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("kvocab_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [mousePos, setMousePos] = useState({ x: -999, y: -999 });
  const cursorRef = useRef(null);

  // ── STATE CHO PERSONALIZATION PANEL ───────────────────────
  const [showSettings, setShowSettings] = useState(false);
  const [customColors, setCustomColors] = useState({
    bgFrom: "#fbcfe8",
    bgVia: "#f3e8ff",
    bgTo: "#e0e7ff",
    deckBg: "rgba(255,255,255,0.42)",
    deckTitle: "#111827",
    flashcardFrontBg: "rgba(255,255,255,0.65)",
    flashcardFrontText: "#a855f7",
    flashcardBackText: "#111827",
    navButtonBg: "#ffffff",
    navButtonText: "#7e22ce",
    checklistBg: "#dcfce7",
    checklistText: "#16a34a",
  });
  const [fontTitle, setFontTitle] = useState("SVN-Busan Garden, sans-serif");
  const [fontBody, setFontBody] = useState(
    "ZFangelring, -apple-system, BlinkMacSystemFont, sans-serif"
  );

  // Preset palettes (giữ nguyên)
  const palettes = {
    "Pink Dream": {
      bgFrom: "#fbcfe8",
      bgVia: "#f3e8ff",
      bgTo: "#e0e7ff",
      deckBg: "rgba(255,255,255,0.42)",
      deckTitle: "#111827",
      flashcardFrontBg: "rgba(255,255,255,0.65)",
      flashcardFrontText: "#a855f7",
      flashcardBackText: "#111827",
      navButtonBg: "#ffffff",
      navButtonText: "#7e22ce",
      checklistBg: "#dcfce7",
      checklistText: "#16a34a",
    },
    "Lavender Fields": {
      bgFrom: "#e9d5ff",
      bgVia: "#d8b4fe",
      bgTo: "#c084fc",
      deckBg: "rgba(255,255,255,0.5)",
      deckTitle: "#4c1d95",
      flashcardFrontBg: "rgba(245,243,255,0.8)",
      flashcardFrontText: "#6b21a5",
      flashcardBackText: "#3b0764",
      navButtonBg: "#f3e8ff",
      navButtonText: "#7e22ce",
      checklistBg: "#e0e7ff",
      checklistText: "#4338ca",
    },
    "Minty Fresh": {
      bgFrom: "#ccfbf1",
      bgVia: "#a7f3d0",
      bgTo: "#6ee7b7",
      deckBg: "rgba(255,255,255,0.55)",
      deckTitle: "#064e3b",
      flashcardFrontBg: "rgba(236,253,245,0.8)",
      flashcardFrontText: "#0f766e",
      flashcardBackText: "#022c22",
      navButtonBg: "#ecfdf5",
      navButtonText: "#047857",
      checklistBg: "#fef3c7",
      checklistText: "#b45309",
    },
  };

  // ==========================================
  // VỊ TRÍ 2: LOGIC TẠO HOA RƠI RANDOM
  // Đặt đoạn này ngay đầu hàm App() hoặc cùng cụm với các khai báo useState

  // ==========================================
  // VỊ TRÍ 2: LOGIC TẠO HOA TUYẾT RƠI RANDOM (ĐÃ TỐI ƯU CHO PNG)
  // ==========================================
  const [petals, setPetals] = useState([]);

  useEffect(() => {
    const maxPetals = 20; // Số lượng bông tuyết xuất hiện cùng lúc

    const generatePetal = () => {
      // Kích thước ngẫu nhiên (từ 10px đến 25px)
      const randomSize = Math.random() * 15 + 10;

      // Hiệu ứng độ sâu trường ảnh (Depth of Field)
      // Bông tuyết nhỏ < 16px ở xa -> mờ ảo (blur) và mờ đục (opacity thấp)
      const isDistant = randomSize < 16;
      const blurAmount = isDistant ? Math.random() * 2 + 1.5 : 0;
      const opacity = isDistant
        ? Math.random() * 0.3 + 0.3
        : Math.random() * 0.4 + 0.6;

      // Thời gian rơi chậm lofi (8 giây đến 16 giây từ đỉnh xuống đáy)
      const randomFallDuration = Math.random() * 8 + 8;

      // Thời gian lắc lư theo gió nhẹ qua lại (3 giây đến 6 giây)
      const randomSwayDuration = Math.random() * 3 + 3;

      return {
        id: Math.random().toString(36).substring(2, 11),
        left: `${Math.random() * 100}vw`, // Xuất hiện ngẫu nhiên theo chiều ngang màn hình
        size: randomSize,
        blur: blurAmount,
        opacity: opacity,
        fallDuration: randomFallDuration,
        swayDuration: randomSwayDuration,
        delay: Math.random() * 15, // Lùi thời gian bắt đầu rơi để rải rác tự nhiên
      };
    };

    // Khởi tạo danh sách bông tuyết rơi
    setPetals(Array.from({ length: maxPetals }).map(generatePetal));
  }, []);

  // Áp dụng CSS Variables (bổ sung thêm biến notebook)
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--bg-gradient-from", customColors.bgFrom);
    root.style.setProperty("--bg-gradient-via", customColors.bgVia);
    root.style.setProperty("--bg-gradient-to", customColors.bgTo);
    root.style.setProperty("--deck-card-bg", customColors.deckBg);
    root.style.setProperty("--deck-title-color", customColors.deckTitle);
    root.style.setProperty(
      "--flashcard-front-bg",
      customColors.flashcardFrontBg
    );
    root.style.setProperty(
      "--flashcard-front-text",
      customColors.flashcardFrontText
    );
    root.style.setProperty(
      "--flashcard-back-text",
      customColors.flashcardBackText
    );
    root.style.setProperty("--nav-button-bg", customColors.navButtonBg);
    root.style.setProperty("--nav-button-text", customColors.navButtonText);
    root.style.setProperty("--checklist-button-bg", customColors.checklistBg);
    root.style.setProperty(
      "--checklist-button-text",
      customColors.checklistText
    );
    // Font
    root.style.setProperty("--font-family-title", fontTitle);
    root.style.setProperty("--font-family-body", fontBody);
  }, [customColors, fontTitle, fontBody]);

  const applyPalette = (paletteName) => {
    const palette = palettes[paletteName];
    if (palette) {
      setCustomColors((prev) => ({ ...prev, ...palette }));
    }
  };

  const resetToDefault = () => {
    setCustomColors({
      bgFrom: "#fbcfe8",
      bgVia: "#f3e8ff",
      bgTo: "#e0e7ff",
      deckBg: "rgba(255,255,255,0.42)",
      deckTitle: "#111827",
      flashcardFrontBg: "rgba(255,255,255,0.65)",
      flashcardFrontText: "#a855f7",
      flashcardBackText: "#111827",
      navButtonBg: "#ffffff",
      navButtonText: "#7e22ce",
      checklistBg: "#dcfce7",
      checklistText: "#16a34a",
    });
    setFontTitle("SVN-Busan Garden, sans-serif");
    setFontBody("ZFangelring, -apple-system, BlinkMacSystemFont, sans-serif");
  };

  // ── CÁC HÀM XỬ LÝ DỮ LIỆU (GIỮ NGUYÊN 100%) ───────────────────
  const activeDeck = decks.find((d) => d._id === activeDeckId) || null;
  useEffect(() => {
    const onMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0) translate(-50%,-50%)`;
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (currentView !== "study" || !activeDeck || !activeDeck.cards?.length)
        return;
      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((p) => !p);
      }
      if (e.code === "ArrowRight" && cardIndex < activeDeck.cards.length - 1) {
        setCardIndex((p) => p + 1);
        setIsFlipped(false);
      }
      if (e.code === "ArrowLeft" && cardIndex > 0) {
        setCardIndex((p) => p - 1);
        setIsFlipped(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentView, activeDeck, cardIndex]);

  const fetchDecks = useCallback(async () => {
    try {
      setSaveStatus("saving");
      const emailParam = user?.email || "guest";
      const res = await axios.get(`${API_URL}?userEmail=${emailParam}`);
      if (Array.isArray(res.data)) setDecks(res.data);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
      setSaveStatus("error");
    }
  }, [user]);

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  const handleLoginSuccess = (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const userData = {
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        sub: decoded.sub,
      };
      setUser(userData);
      localStorage.setItem("kvocab_user", JSON.stringify(userData));
      setShowWelcome(false);
    } catch (err) {
      console.error("Lỗi decode token:", err);
      setSaveStatus("error");
    }
  };
  const handleLoginError = () => {
    console.warn("Đăng nhập thất bại");
    setSaveStatus("error");
    setTimeout(() => setSaveStatus(""), 3000);
  };
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("kvocab_user");
    setDecks([]);
    setCurrentView("home");
    setActiveDeckId(null);
  };

  const handleCreateDeck = async () => {
    if (!newDeckTitle.trim()) return;
    try {
      setSaveStatus("saving");
      const res = await axios.post(API_URL, {
        title: newDeckTitle.trim(),
        userEmail: user?.email || "guest",
        cards: [],
      });
      setDecks((prev) => [...prev, res.data]);
      setNewDeckTitle("");
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (err) {
      console.error("Lỗi tạo bộ từ:", err);
      setSaveStatus("error");
    }
  };

  const handleDeleteDeck = async (deckId, e) => {
    e?.stopPropagation();
    if (!window.confirm("Bạn có chắc muốn xóa toàn bộ bộ từ vựng này không?"))
      return;
    try {
      setSaveStatus("saving");
      await axios.delete(
        `${API_URL}/${deckId}?userEmail=${encodeURIComponent(
          user?.email || "guest"
        )}`
      );
      setDecks((prev) => prev.filter((d) => d._id !== deckId));
      if (activeDeckId === deckId) {
        setCurrentView("home");
        setActiveDeckId(null);
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (err) {
      console.error("Lỗi xóa bộ từ:", err);
      setSaveStatus("error");
    }
  };

  const handleAddCard = async () => {
    if (!newCard.korean.trim() || !newCard.viet.trim()) {
      alert("Vui lòng nhập tối thiểu tiếng Hàn và nghĩa tiếng Việt!");
      return;
    }
    if (!activeDeckId) return;
    try {
      setSaveStatus("saving");
      const res = await axios.put(`${API_URL}/${activeDeckId}/cards`, newCard);
      setDecks((prev) =>
        prev.map((d) => (d._id === activeDeckId ? res.data : d))
      );
      setNewCard({ korean: "", romaji: "", viet: "", note: "" });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (err) {
      console.warn("Thử fallback PUT toàn bộ deck:", err);
      try {
        const currentDeck = decks.find((d) => d._id === activeDeckId);
        const updatedCards = [
          ...(currentDeck.cards || []),
          { ...newCard, id: Date.now().toString() },
        ];
        const res2 = await axios.put(`${API_URL}/${activeDeckId}`, {
          ...currentDeck,
          cards: updatedCards,
        });
        setDecks((prev) =>
          prev.map((d) => (d._id === activeDeckId ? res2.data : d))
        );
        setNewCard({ korean: "", romaji: "", viet: "", note: "" });
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus(""), 2000);
      } catch (err2) {
        console.error("Lỗi thêm thẻ:", err2);
        setSaveStatus("error");
      }
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm("Xóa thẻ từ này khỏi bộ?")) return;
    try {
      setSaveStatus("saving");
      const currentDeck = decks.find((d) => d._id === activeDeckId);
      const updatedCards = (currentDeck.cards || []).filter(
        (c) => (c._id || c.id) !== cardId
      );
      const res = await axios.put(`${API_URL}/${activeDeckId}`, {
        ...currentDeck,
        cards: updatedCards,
      });
      setDecks((prev) =>
        prev.map((d) => (d._id === activeDeckId ? res.data : d))
      );
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (err) {
      console.error("Lỗi xóa thẻ:", err);
      setSaveStatus("error");
    }
  };

  const handleMarkAsLearned = async (card) => {
    if (!user) {
      alert("Vui lòng đăng nhập để lưu từ này vào danh sách 'Đã học' nhé!");
      return;
    }
    if (!card) return;
    try {
      setSaveStatus("saving");
      let learnedDeck = decks.find(
        (d) => d.title === "Đã học ✅" && d.userEmail === user.email
      );
      if (!learnedDeck) {
        const createRes = await axios.post(API_URL, {
          title: "Đã học ✅",
          userEmail: user.email,
          cards: [],
        });
        learnedDeck = createRes.data;
        setDecks((prev) => [...prev, learnedDeck]);
      }
      const alreadyIn = (learnedDeck.cards || []).some(
        (c) => c.korean === card.korean
      );
      if (alreadyIn) {
        alert("Từ này đã nằm trong bộ Đã học rồi!");
        setSaveStatus("");
        return;
      }
      const updateRes = await axios.put(`${API_URL}/${learnedDeck._id}/cards`, {
        korean: card.korean,
        romaji: card.romaji,
        viet: card.viet,
        note: card.note,
      });
      setDecks((prev) =>
        prev.map((d) => (d._id === learnedDeck._id ? updateRes.data : d))
      );
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (err) {
      console.warn("Fallback PUT learned deck:", err);
      try {
        const learnedDeck = decks.find(
          (d) => d.title === "Đã học ✅" && d.userEmail === user.email
        );
        if (learnedDeck) {
          const updatedCards = [
            ...(learnedDeck.cards || []),
            { ...card, id: Date.now().toString() },
          ];
          const res2 = await axios.put(`${API_URL}/${learnedDeck._id}`, {
            ...learnedDeck,
            cards: updatedCards,
          });
          setDecks((prev) =>
            prev.map((d) => (d._id === learnedDeck._id ? res2.data : d))
          );
        }
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus(""), 2000);
      } catch (err2) {
        console.error("Lỗi lưu đã học:", err2);
        setSaveStatus("error");
      }
    }
  };

  const renderSaveStatus = () => {
    if (saveStatus === "saving")
      return (
        <span className="flex items-center gap-1.5 text-purple-600 font-semibold text-xs bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-purple-100 shadow-sm">
          <Loader2 className="animate-spin" size={13} /> Đang đồng bộ...
        </span>
      );
    if (saveStatus === "saved")
      return (
        <span className="flex items-center gap-1.5 text-green-600 font-semibold text-xs bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-green-100 shadow-sm">
          <Check size={13} /> Đã lưu an toàn ✓
        </span>
      );
    if (saveStatus === "error")
      return (
        <span className="flex items-center gap-1.5 text-red-500 font-semibold text-xs bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-red-100 shadow-sm">
          <X size={13} /> Lỗi kết nối DB
        </span>
      );
    return null;
  };

  // ════════════════════════════════════════════════════════════
  //  RENDER (giữ nguyên cấu trúc, chỉ bổ sung notebook note)
  // ════════════════════════════════════════════════════════════
  return (
    <div
      className="relative min-h-screen overflow-x-hidden selection:bg-pink-200"
      style={{
        background: `linear-gradient(135deg, var(--bg-gradient-from), var(--bg-gradient-via), var(--bg-gradient-to))`,
      }}
    >
      {/* sakura blossom */}
      <div className="cherry-blossom-container">
        {petals.map((petal) => (
          <div
            key={petal.id}
            className="petal"
            style={{
              left: petal.left,
              width: `${petal.size}px`,
              height: `${petal.size}px`,
              opacity: petal.opacity,
              filter: `blur(${petal.blur}px)`, // Giữ hiệu ứng mờ ảo chiều sâu 3D
              animationDuration: `${petal.fallDuration}s, ${petal.swayDuration}s`, // Giữ nguyên tốc độ rơi chậm lofi
              animationDelay: `${petal.delay}s, ${petal.delay}s`,
            }}
          >
            {SVG_TEMPLATE}{" "}
            {/* Lúc này lõi bên trong đã tự động biến thành thẻ <img> chứa hoa tuyết của bạn */}
          </div>
        ))}
      </div>

      {/* Bubble gradient theo chuột */}
      <div
        ref={cursorRef}
        className="pointer-events-none fixed top-0 left-0 z-0 w-[500px] h-[500px] rounded-full hidden md:block will-change-transform"
        style={{
          background: `radial-gradient(circle, var(--bubble-gradient-start) 0%, var(--bubble-gradient-mid) 40%, var(--bubble-gradient-end) 70%)`,
          filter: "blur(40px)",
          transform: "translate3d(-999px,-999px,0) translate(-50%,-50%)",
          transition: "transform 0.08s linear",
        }}
      />

      {/* Welcome Modal (giữ nguyên) */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-md">
          <div
            className="animate-fade-in glass border border-white/60 p-8 rounded-3xl shadow-2xl max-w-md w-11/12 text-center relative"
            style={{ background: "var(--modal-bg)" }}
          >
            <h2
              className="text-3xl md:text-4xl font-black mb-4 font-title tracking-wider"
              style={{ color: "var(--modal-title)" }}
            >
              Annyeonghaseyo〜〜 🌸
            </h2>
            <p className="text-gray-600 mb-8 text-base leading-relaxed font-medium">
              bạn đã quay trở lại không gian học tập. Hệ thống cơ sở dữ liệu đã
              sẵn sàng, bạn muốn cưới gái cosplay chứ 🥰😇
            </p>
            {!user && (
              <div className="flex justify-center mb-5">
                <GoogleLogin
                  onSuccess={handleLoginSuccess}
                  onError={handleLoginError}
                  useOneTap
                />
              </div>
            )}
            <div className="flex justify-center gap-4 flex-wrap">
              <button
                onClick={() => setShowWelcome(false)}
                className="px-8 py-3 bg-gradient-to-r from-pink-400 to-purple-500 text-white rounded-full font-bold hover:opacity-95 hover:scale-105 transition-all shadow-md shadow-purple-200"
                style={{
                  background: `linear-gradient(to right, var(--modal-button-grad-from), var(--modal-button-grad-to))`,
                }}
              >
                học để cưới gái highlight tattoo 😋 🔥
              </button>
              <button
                onClick={() => {
                  alert("Từ chối không được đâu nhé, học tập chăm chỉ đi nào!");
                  setShowWelcome(false);
                }}
                className="px-6 py-3 bg-white/60 text-gray-700 rounded-full font-semibold hover:bg-white/90 transition-all border border-gray-200"
                style={{ background: "var(--modal-button-secondary-bg)" }}
              >
                đéo mún học
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast trạng thái */}
      {saveStatus && (
        <div className="fixed top-4 right-4 z-40 glass border border-white/60 px-4 py-2.5 rounded-full shadow-lg">
          {renderSaveStatus()}
        </div>
      )}

      {/* FLOATING ACTION BUTTON (Settings) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="glass p-4 rounded-full shadow-xl hover:scale-110 transition-all duration-300 backdrop-blur-md border border-white/50"
          style={{ background: "rgba(255,255,255,0.6)" }}
        >
          <Paintbrush size={28} className="text-purple-600" />
        </button>
      </div>

      {/* SETTINGS SIDEBAR PANEL (giữ nguyên) */}
      <div
        className={`fixed top-0 right-0 h-full w-80 z-50 glass shadow-2xl transform transition-transform duration-300 ease-in-out ${
          showSettings ? "translate-x-0" : "translate-x-full"
        } backdrop-blur-xl border-l border-white/30`}
        style={{ background: "rgba(255,255,255,0.85)" }}
      >
        <div className="p-5 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-purple-800 font-title">
              ✨ Tuỳ chỉnh giao diện
            </h3>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 rounded-full hover:bg-white/50"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">
                🎨 Bảng màu có sẵn
              </label>
              <div className="flex gap-3 flex-wrap">
                {Object.keys(palettes).map((name) => (
                  <button
                    key={name}
                    onClick={() => applyPalette(name)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/60 shadow-sm hover:scale-105 transition"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">
                🌈 Màu nền trang
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={customColors.bgFrom}
                  onChange={(e) =>
                    setCustomColors((prev) => ({
                      ...prev,
                      bgFrom: e.target.value,
                    }))
                  }
                  className="w-10 h-10 rounded border"
                />
                <span>→</span>
                <input
                  type="color"
                  value={customColors.bgVia}
                  onChange={(e) =>
                    setCustomColors((prev) => ({
                      ...prev,
                      bgVia: e.target.value,
                    }))
                  }
                  className="w-10 h-10 rounded border"
                />
                <span>→</span>
                <input
                  type="color"
                  value={customColors.bgTo}
                  onChange={(e) =>
                    setCustomColors((prev) => ({
                      ...prev,
                      bgTo: e.target.value,
                    }))
                  }
                  className="w-10 h-10 rounded border"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">
                📦 Bộ từ vựng (nền)
              </label>
              <input
                type="color"
                value={
                  customColors.deckBg.startsWith("#")
                    ? customColors.deckBg
                    : "#ffffff"
                }
                onChange={(e) =>
                  setCustomColors((prev) => ({
                    ...prev,
                    deckBg: e.target.value,
                  }))
                }
                className="w-full"
              />
              <label className="block text-sm font-bold text-gray-600 mt-2">
                📝 Màu chữ tiêu đề deck
              </label>
              <input
                type="color"
                value={customColors.deckTitle}
                onChange={(e) =>
                  setCustomColors((prev) => ({
                    ...prev,
                    deckTitle: e.target.value,
                  }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">
                🃏 Flashcard mặt trước (nền)
              </label>
              <input
                type="color"
                value={
                  customColors.flashcardFrontBg.startsWith("#")
                    ? customColors.flashcardFrontBg
                    : "#ffffff"
                }
                onChange={(e) =>
                  setCustomColors((prev) => ({
                    ...prev,
                    flashcardFrontBg: e.target.value,
                  }))
                }
              />
              <label className="block text-sm font-bold text-gray-600 mt-2">
                🔠 Màu chữ tiếng Hàn
              </label>
              <input
                type="color"
                value={customColors.flashcardFrontText}
                onChange={(e) =>
                  setCustomColors((prev) => ({
                    ...prev,
                    flashcardFrontText: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">
                🃏 Flashcard mặt sau (nền)
              </label>
              <input
                type="color"
                value="#fff0f8"
                disabled
                className="w-full opacity-50"
              />
              <label className="block text-sm font-bold text-gray-600 mt-2">
                📖 Màu chữ nghĩa tiếng Việt
              </label>
              <input
                type="color"
                value={customColors.flashcardBackText}
                onChange={(e) =>
                  setCustomColors((prev) => ({
                    ...prev,
                    flashcardBackText: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">
                ⭕ Nút mũi tên (nền)
              </label>
              <input
                type="color"
                value={customColors.navButtonBg}
                onChange={(e) =>
                  setCustomColors((prev) => ({
                    ...prev,
                    navButtonBg: e.target.value,
                  }))
                }
              />
              <label className="block text-sm font-bold text-gray-600 mt-2">
                🎨 Màu icon mũi tên
              </label>
              <input
                type="color"
                value={customColors.navButtonText}
                onChange={(e) =>
                  setCustomColors((prev) => ({
                    ...prev,
                    navButtonText: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">
                ✅ Nút Đã học (nền)
              </label>
              <input
                type="color"
                value={customColors.checklistBg}
                onChange={(e) =>
                  setCustomColors((prev) => ({
                    ...prev,
                    checklistBg: e.target.value,
                  }))
                }
              />
              <label className="block text-sm font-bold text-gray-600 mt-2">
                ✅ Màu icon checklist
              </label>
              <input
                type="color"
                value={customColors.checklistText}
                onChange={(e) =>
                  setCustomColors((prev) => ({
                    ...prev,
                    checklistText: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">
                🔤 Font tiêu đề (tên font)
              </label>
              <input
                type="text"
                value={fontTitle}
                onChange={(e) => setFontTitle(e.target.value)}
                className="w-full border rounded px-2 py-1"
                placeholder="SVN-Busan Garden, sans-serif"
              />
              <label className="block text-sm font-bold text-gray-600 mt-2">
                📄 Font nội dung
              </label>
              <input
                type="text"
                value={fontBody}
                onChange={(e) => setFontBody(e.target.value)}
                className="w-full border rounded px-2 py-1"
                placeholder="ZFangelring, sans-serif"
              />
            </div>
            <button
              onClick={resetToDefault}
              className="w-full mt-4 py-2 bg-purple-100 text-purple-700 rounded-xl font-bold hover:bg-purple-200 transition"
            >
              Khôi phục mặc định
            </button>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          NỘI DUNG CHÍNH (giữ nguyên logic, cập nhật textarea + notebook note)
         ════════════════════════════════════════════════════════ */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <header
          className="flex justify-between items-center mb-10 glass border border-white/50 px-5 py-3 rounded-2xl shadow-sm"
          style={{
            background: "var(--header-bg)",
            borderColor: "var(--header-border)",
          }}
        >
          <div className="flex items-center gap-4 flex-wrap">
            <h1
              onClick={() => setCurrentView("home")}
              className="cursor-pointer text-2xl md:text-3xl font-black font-title bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent flex items-center gap-2 select-none"
              style={{
                backgroundImage: `linear-gradient(to right, var(--header-logo-grad-from), var(--header-logo-grad-to))`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
              }}
            >
              <Sparkles size={22} className="text-pink-400" />
              K-VOCAB STUDY LAB
            </h1>
            <div className="hidden md:block">{renderSaveStatus()}</div>
          </div>
          <div className="flex items-center gap-3">
            {!user ? (
              <div className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <GoogleLogin
                  onSuccess={handleLoginSuccess}
                  onError={handleLoginError}
                  useOneTap
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm border border-white/50 animate-fade-in">
                <img
                  src={user.picture}
                  alt="Avatar"
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border-2 border-purple-200 object-cover shadow-sm"
                />
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">
                    Tài khoản
                  </span>
                  <span className="font-bold text-sm text-purple-950 font-title">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-1 flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95 border border-red-100"
                >
                  <LogOut size={13} /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        </header>

        {/* VIEW HOME (giữ nguyên) */}
        {currentView === "home" && (
          <div className="space-y-8 animate-fade-in">
            <div
              className="glass flex flex-col md:flex-row gap-4 items-center p-5 rounded-2xl border border-white/50 shadow-sm"
              style={{ background: "rgba(255,255,255,0.45)" }}
            >
              <input
                type="text"
                placeholder="Nhập tên bộ từ vựng mới (VD: TOPIK I, Du lịch...)"
                value={newDeckTitle}
                onChange={(e) => setNewDeckTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateDeck()}
                className="flex-1 w-full px-5 py-3 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-800 font-medium placeholder-gray-400"
              />
              <button
                onClick={handleCreateDeck}
                className="w-full md:w-auto px-7 py-3 bg-gradient-to-r from-pink-400 to-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md hover:opacity-95 active:scale-95 transition-all whitespace-nowrap"
                style={{
                  background: `linear-gradient(to right, var(--modal-button-grad-from), var(--modal-button-grad-to))`,
                }}
              >
                <Plus size={20} /> Tạo bộ từ
              </button>
            </div>
            {decks.length === 0 ? (
              <div className="text-center py-16 text-gray-500 font-medium glass rounded-2xl border border-white/40">
                Chưa có dữ liệu. Tạo bộ từ mới ở trên để bắt đầu!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {decks.map((deck) => (
                  <div
                    key={deck._id}
                    onClick={() => {
                      setActiveDeckId(deck._id);
                      setCurrentView("study");
                      setCardIndex(0);
                      setIsFlipped(false);
                    }}
                    className="group relative p-6 rounded-2xl cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border flex flex-col justify-between overflow-hidden"
                    style={{
                      background: "var(--deck-card-bg)",
                      borderColor: "var(--deck-card-border)",
                    }}
                  >
                    <div
                      className="absolute -top-6 -right-6 w-28 h-28 rounded-full pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(251,182,213,0.35) 0%, transparent 70%)",
                      }}
                    />
                    <div>
                      <h3
                        className="text-xl font-bold mb-2 font-title line-clamp-2 pr-6 group-hover:text-purple-600 transition-colors"
                        style={{ color: "var(--deck-title-color)" }}
                      >
                        {deck.title}
                      </h3>
                      <p
                        className="text-sm font-semibold flex items-center gap-1.5 px-3 py-1 rounded-full w-max"
                        style={{
                          background: "var(--deck-stats-bg)",
                          color: "var(--deck-stats-text)",
                        }}
                      >
                        <BookOpen size={14} /> {(deck.cards || []).length} thẻ
                        từ
                      </p>
                    </div>
                    <div className="flex justify-end gap-2 mt-6 relative z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDeckId(deck._id);
                          setCurrentView("edit");
                        }}
                        className="px-4 py-2 bg-white/70 hover:bg-purple-600 hover:text-white rounded-xl text-sm font-bold transition-all border border-white shadow-sm"
                        style={{ background: "var(--deck-button-bg)" }}
                      >
                        Sửa thẻ
                      </button>
                      <button
                        onClick={(e) => handleDeleteDeck(deck._id, e)}
                        className="p-2 bg-white/70 hover:bg-red-50 text-red-500 rounded-xl transition-all border border-white shadow-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW STUDY — BỔ SUNG NOTEBOOK NOTE */}
        {currentView === "study" && activeDeck && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentView("home")}
                className="flex items-center gap-2 font-bold text-purple-800 hover:text-purple-900 transition-colors bg-white/40 px-4 py-2 rounded-full border border-white/50 shadow-sm"
              >
                <ArrowLeft size={18} /> Trang chủ
              </button>
              <button
                onClick={() => setCurrentView("edit")}
                className="px-5 py-2 bg-white/40 hover:bg-white/70 text-pink-600 font-bold rounded-full border border-white/50 shadow-sm transition"
              >
                + Thêm thẻ
              </button>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 font-title mb-1">
                {activeDeck.title}
              </h2>
              {activeDeck.cards?.length > 0 && (
                <p className="text-sm font-bold text-gray-400 tracking-wider">
                  Thẻ {cardIndex + 1} / {activeDeck.cards.length} &nbsp;·&nbsp;
                  <span className="text-purple-400 font-normal italic text-xs">
                    Space để lật · ← → để chuyển
                  </span>
                </p>
              )}
            </div>
            {activeDeck.cards?.length === 0 ? (
              <div className="glass p-12 rounded-3xl text-center text-gray-500 font-medium border border-white/50 shadow-md">
                Chưa có thẻ từ nào cả! <br />
                <button
                  onClick={() => setCurrentView("edit")}
                  className="mt-4 px-6 py-2 bg-gradient-to-r from-pink-400 to-purple-500 text-white rounded-full font-bold hover:opacity-90 transition shadow-md"
                >
                  Thêm thẻ mới
                </button>
              </div>
            ) : (
              <>
                <div
                  className="w-full h-[350px] md:h-[400px] cursor-pointer"
                  style={{ perspective: "1200px" }}
                  onClick={() => setIsFlipped((p) => !p)}
                >
                  <div
                    className="relative w-full h-full"
                    style={{
                      transformStyle: "preserve-3d",
                      transition:
                        "transform 0.55s cubic-bezier(0.23, 1, 0.32, 1)",
                      transform: isFlipped
                        ? "rotateX(180deg)"
                        : "rotateX(0deg)",
                    }}
                  >
                    {/* Mặt trước */}
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center rounded-[2rem] shadow-xl border border-white/70 p-8 text-center select-none"
                      style={{
                        backfaceVisibility: "hidden",
                        background: "var(--flashcard-front-bg)",
                        backdropFilter: "blur(20px)",
                      }}
                    >
                      <span
                        className="font-title font-black tracking-wide mb-3 drop-shadow-sm"
                        style={{
                          fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
                          color: "var(--flashcard-front-text)",
                        }}
                      >
                        {activeDeck.cards[cardIndex]?.korean}
                      </span>
                      {activeDeck.cards[cardIndex]?.romaji && (
                        <span
                          className="text-lg md:text-2xl text-gray-400 font-bold tracking-widest uppercase"
                          style={{ color: "var(--flashcard-front-romaji)" }}
                        >
                          [{activeDeck.cards[cardIndex].romaji}]
                        </span>
                      )}
                      <p className="absolute bottom-5 text-xs text-gray-300 font-medium tracking-wider">
                        Click để xem nghĩa →
                      </p>
                    </div>
                    {/* Mặt sau */}
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center rounded-[2rem] shadow-xl border border-white/70 p-8 text-center select-none"
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateX(180deg)",
                        background: "var(--flashcard-back-bg)",
                        backdropFilter: "blur(20px)",
                      }}
                    >
                      {activeDeck.cards[cardIndex]?.romaji && (
                        <p
                          className="text-sm font-bold tracking-widest uppercase mb-3"
                          style={{ color: "var(--flashcard-back-romaji)" }}
                        >
                          [{activeDeck.cards[cardIndex].romaji}]
                        </p>
                      )}
                      <p
                        className="text-3xl md:text-4xl font-black font-title mb-5"
                        style={{ color: "var(--flashcard-back-text)" }}
                      >
                        {activeDeck.cards[cardIndex]?.viet}
                      </p>
                      {/* === NOTEBOOK NOTE: hiển thị ghi chú với scroll và markdown === */}
                      {activeDeck.cards[cardIndex]?.note && (
                        <div className="notebook-note w-full mt-2">
                          {renderSimpleMarkdown(
                            activeDeck.cards[cardIndex].note
                          )}
                        </div>
                      )}
                      <p className="absolute bottom-5 text-xs text-gray-300 font-medium tracking-wider">
                        ← Click để lật lại
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center items-center gap-4 mt-4">
                  <button
                    onClick={() => {
                      setCardIndex(Math.max(0, cardIndex - 1));
                      setIsFlipped(false);
                    }}
                    disabled={cardIndex === 0}
                    className="p-3.5 rounded-full shadow-md disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 border border-gray-100"
                    style={{
                      background: "var(--nav-button-bg)",
                      color: "var(--nav-button-text)",
                    }}
                  >
                    <ArrowLeft size={22} />
                  </button>
                  <button
                    onClick={() => {
                      setCardIndex(0);
                      setIsFlipped(false);
                    }}
                    className="p-3.5 rounded-full shadow-md transition-all active:scale-95 border border-gray-100"
                    style={{
                      background: "var(--nav-button-bg)",
                      color: "var(--nav-button-text)",
                    }}
                  >
                    <RotateCcw size={20} />
                  </button>
                  <button
                    onClick={() =>
                      handleMarkAsLearned(activeDeck.cards[cardIndex])
                    }
                    className="p-3.5 rounded-full shadow-md transition-all active:scale-95 hover:scale-110 border"
                    style={{
                      background: "var(--checklist-button-bg)",
                      color: "var(--checklist-button-text)",
                      borderColor: "var(--checklist-button-border)",
                    }}
                  >
                    <CheckSquare size={22} />
                  </button>
                  <button
                    onClick={() => {
                      setCardIndex(
                        Math.min(activeDeck.cards.length - 1, cardIndex + 1)
                      );
                      setIsFlipped(false);
                    }}
                    disabled={cardIndex === activeDeck.cards.length - 1}
                    className="p-3.5 rounded-full shadow-md disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 border border-gray-100"
                    style={{
                      background: "var(--nav-button-bg)",
                      color: "var(--nav-button-text)",
                    }}
                  >
                    <ArrowRight size={22} />
                  </button>
                </div>
                <p className="text-center text-xs text-gray-400 -mt-1">
                  ✅ = Lưu vào bộ "Đã học" · cần đăng nhập để sync
                </p>
              </>
            )}
          </div>
        )}

        {/* VIEW EDIT — THAY input NOTE BẰNG textarea */}
        {currentView === "edit" && activeDeck && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <button
                onClick={() => setCurrentView("study")}
                className="flex items-center gap-2 font-bold text-purple-800 hover:text-purple-900 transition-colors bg-white/40 px-4 py-2 rounded-full border border-white/50 shadow-sm"
              >
                <ArrowLeft size={18} /> Quay lại học
              </button>
              <div>{renderSaveStatus()}</div>
            </div>
            <div
              className="glass p-6 rounded-2xl border border-white/50 space-y-4 shadow-md"
              style={{ background: "var(--edit-form-bg)" }}
            >
              <h2 className="text-2xl font-bold text-gray-900 font-title">
                Thêm thẻ vào:{" "}
                <span className="text-purple-600">{activeDeck.title}</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1 tracking-wide">
                    Từ tiếng Hàn *
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 사과"
                    value={newCard.korean}
                    onChange={(e) =>
                      setNewCard({ ...newCard, korean: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 font-title text-xl text-gray-800 placeholder-gray-300"
                    style={{
                      background: "var(--edit-input-bg)",
                      focusRingColor: "var(--edit-input-focus)",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1 tracking-wide">
                    Phiên âm Romaji
                  </label>
                  <input
                    type="text"
                    placeholder="VD: sagwa"
                    value={newCard.romaji}
                    onChange={(e) =>
                      setNewCard({ ...newCard, romaji: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 font-medium text-gray-700 placeholder-gray-300"
                    style={{ background: "var(--edit-input-bg)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1 tracking-wide">
                    Nghĩa tiếng Việt *
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Quả táo"
                    value={newCard.viet}
                    onChange={(e) =>
                      setNewCard({ ...newCard, viet: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 font-medium text-lg text-gray-800 placeholder-gray-300"
                    style={{ background: "var(--edit-input-bg)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1 tracking-wide">
                    Ghi chú / Ví dụ (hỗ trợ **bold** và *italic*)
                  </label>
                  <textarea
                    rows="4"
                    placeholder="VD: **사과** là quả táo.\n*Tôi thích ăn táo.*"
                    value={newCard.note}
                    onChange={(e) =>
                      setNewCard({ ...newCard, note: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 font-medium text-gray-700 placeholder-gray-300 resize-y"
                    style={{ background: "var(--edit-input-bg)" }}
                  />
                </div>
              </div>
              <button
                onClick={handleAddCard}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md hover:opacity-95 active:scale-[0.99] transition-all mt-2"
              >
                <Plus size={18} /> Thêm thẻ vào bộ (Auto-save DB)
              </button>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-gray-900 font-title ml-1">
                Danh sách thẻ hiện có ({(activeDeck.cards || []).length})
              </h3>
              {(activeDeck.cards || []).length === 0 ? (
                <div className="text-center py-10 text-gray-500 font-medium glass rounded-2xl border border-white/40">
                  Chưa có thẻ từ nào. Nhập phía trên để bắt đầu!
                </div>
              ) : (
                <div className="space-y-3">
                  {(activeDeck.cards || []).map((card, index) => (
                    <div
                      key={card._id || card.id || index}
                      className="glass px-5 py-4 rounded-xl flex items-center justify-between gap-4 border border-white/40 hover:bg-white/55 transition-all"
                      style={{ background: "var(--edit-card-bg)" }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-6 flex-1 items-center">
                        <span
                          className="text-xl font-black font-title"
                          style={{ color: "var(--edit-card-korean)" }}
                        >
                          {card.korean}
                        </span>
                        {card.romaji ? (
                          <span
                            className="text-sm font-bold tracking-wide"
                            style={{ color: "var(--edit-card-romaji)" }}
                          >
                            [{card.romaji}]
                          </span>
                        ) : (
                          <span className="hidden md:inline text-gray-300">
                            —
                          </span>
                        )}
                        <span
                          className="text-base font-bold font-title"
                          style={{ color: "var(--edit-card-viet)" }}
                        >
                          {card.viet}
                        </span>
                      </div>
                      {card.note && (
                        <div
                          className="hidden lg:block text-xs px-3 py-1.5 rounded-lg max-w-xs truncate border border-white/40"
                          style={{
                            background: "var(--edit-card-note-bg)",
                            color: "var(--edit-card-romaji)",
                          }}
                        >
                          {card.note.length > 60
                            ? card.note.slice(0, 60) + "…"
                            : card.note}
                        </div>
                      )}
                      <button
                        onClick={() => handleDeleteCard(card._id || card.id)}
                        className="p-2 transition-colors"
                        style={{ color: "var(--edit-delete-icon)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color =
                            "var(--edit-delete-icon-hover)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color =
                            "var(--edit-delete-icon)")
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  HƯỚNG DẪN SỬ DỤNG NOTEBOOK NOTE
// ════════════════════════════════════════════════════════════
// 1. Trong Edit view, ô "Ghi chú / Ví dụ" là textarea nhiều dòng.
// 2. Bạn có thể nhập văn bản dài, xuống dòng, và sử dụng **chữ đậm** hoặc *chữ nghiêng*.
// 3. Khi học ở mặt sau flashcard, phần ghi chú hiển thị trong khung "Notebook" có thanh cuộn, nền mờ, viền pastel.
// 4. Có thể tùy chỉnh màu khung note, chữ, thanh cuộn bằng các biến CSS:
//    --notebook-bg, --notebook-border, --notebook-text, --notebook-scrollbar-thumb, --notebook-scrollbar-track
// 5. Giữ nguyên mọi chức năng khác: phím tắt, đồng bộ DB, checklist, v.v.
// ════════════════════════════════════════════════════════════
