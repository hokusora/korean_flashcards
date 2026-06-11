// ============================================================
//  K-VOCAB STUDY LAB — App.jsx (PHIÊN BẢN HOÀN CHỈNH)
//  Gộp giao diện glassmorphism/pink-pastel từ oldbutnogg.jsx
//  + logic sign-in / database chuẩn từ App.jsx mới
//  + fix lỗi lưu data, sync, sign-in persist
//  + nút checklist "Đã học" ngang hàng mũi tên
//  + hướng dẫn đổi màu chi tiết (tìm nhãn ══ MÀU ══)
// ============================================================

// ════════════════════════════════════════════════════════════
//  HƯỚNG DẪN ĐỔI MÀU NHANH
//  Ctrl+F tìm theo nhãn dưới đây để tìm đúng chỗ cần sửa:
//
//  🎨 [MÀU NỀN TRANG]        → className "min-h-screen" wrapper
//  🎨 [MÀU BUBBLE GRADIENT]   → style radialGradient của mousePos
//  🎨 [MÀU WELCOME MODAL]     → div "fixed inset-0 z-50"
//  🎨 [MÀU HEADER BAR]        → div "flex justify-between" header
//  🎨 [MÀU TIÊU ĐỀ]           → h1 "K-VOCAB STUDY LAB"
//  🎨 [MÀU KHUNG BỘ TỪ VỰNG] → deck card trên trang Home
//  🎨 [MÀU FLASHCARD MẶT TRƯỚC] → mặt trước flashcard (tiếng Hàn)
//  🎨 [MÀU FLASHCARD MẶT SAU]   → mặt sau flashcard (tiếng Việt)
//  🎨 [MÀU CHỮ TIẾNG HÀN]    → span tiếng Hàn mặt trước
//  🎨 [MÀU CHỮ TIẾNG VIỆT]   → span tiếng Việt mặt sau
//  🎨 [MÀU NÚT MŨI TÊN]      → p3/p4 nav buttons bên dưới flashcard
//  🎨 [MÀU NÚT CHECKLIST]    → nút CheckSquare đánh dấu đã học
//  🎨 [MÀU DANH SÁCH TỪ]     → card trong Edit view
//  🎨 [MÀU INPUT]             → input text fields
//  🎨 [MÀU NÚT TẠO BỘ TỪ]   → nút Tạo bộ từ / Lưu thẻ
// ════════════════════════════════════════════════════════════

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
} from "lucide-react";
import axios from "axios";

// ────────────────────────────────────────────────────────────
//  ENDPOINT API — thay URL nếu bạn đổi backend
// ────────────────────────────────────────────────────────────
const API_URL = "https://flashcard-backend-aa18.onrender.com/api/decks";

// ────────────────────────────────────────────────────────────
//  CSS GLOBAL — glassmorphism, 3D flip, font, animations
//  (Paste vào index.css hoặc thẻ <style> trong index.html
//   nếu bạn dùng Tailwind JIT; để đây để nhắc nhở)
// ────────────────────────────────────────────────────────────
const GLOBAL_STYLE = `
  /* Để dùng font OTF tùy chỉnh, thêm vào index.css:
     @font-face {
       font-family: 'MyFont';
       src: url('/fonts/TenfonTypeWriter.otf') format('opentype');
     }
     .font-title { font-family: 'MyFont', sans-serif; }
  */

  .glass {
    background: rgba(255, 255, 255, 0.45);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
  }

  /* 3D flip */
  .perspective-1000 { perspective: 1200px; }
  .transform-style-3d { transform-style: preserve-3d; }
  .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
  .rotate-y-180 { transform: rotateY(180deg); }

  /* Fade-in khi render */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in { animation: fadeIn 0.4s ease both; }

  /* Hiệu ứng nảy nhẹ khi hover deck card */
  @keyframes floatUp {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-4px); }
  }
`;

// Inject style vào head (chỉ 1 lần)
if (
  typeof document !== "undefined" &&
  !document.getElementById("kvocab-style")
) {
  const s = document.createElement("style");
  s.id = "kvocab-style";
  s.textContent = GLOBAL_STYLE;
  document.head.appendChild(s);
}

// ════════════════════════════════════════════════════════════
//  COMPONENT CHÍNH
// ════════════════════════════════════════════════════════════
export default function App() {
  // ── STATE ────────────────────────────────────────────────
  const [decks, setDecks] = useState([]);
  const [currentView, setCurrentView] = useState("home"); // "home" | "study" | "edit"
  const [activeDeckId, setActiveDeckId] = useState(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [saveStatus, setSaveStatus] = useState(""); // "" | "saving" | "saved" | "error"

  const [showWelcome, setShowWelcome] = useState(true);
  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [newCard, setNewCard] = useState({
    korean: "",
    romaji: "",
    viet: "",
    note: "",
  });

  // ── FIX SIGN-IN PERSIST: Lưu user vào localStorage để không mất khi reload ──
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("kvocab_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Bubble gradient theo vị trí chuột
  const [mousePos, setMousePos] = useState({ x: -999, y: -999 });
  const cursorRef = useRef(null);

  // ── DERIVED ──────────────────────────────────────────────
  const activeDeck = decks.find((d) => d._id === activeDeckId) || null;

  // ── HIỆU ỨNG CHUỘT ───────────────────────────────────────
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

  // ── PHÍM TẮT (Space lật, Arrow chuyển thẻ) ───────────────
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

  // ── TẢI DỮ LIỆU TỪ MONGODB ───────────────────────────────
  // FIX: Lọc theo userEmail để mỗi tài khoản chỉ thấy dữ liệu của mình.
  // Nếu chưa đăng nhập dùng email "guest" (dữ liệu chung / ẩn danh).
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

  // ── ĐĂNG NHẬP GOOGLE ─────────────────────────────────────
  // FIX: Lưu user vào localStorage để persist qua reload / session.
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
      // Sau khi đăng nhập, đóng welcome modal ngay
      setShowWelcome(false);
    } catch (err) {
      console.error("Lỗi decode token:", err);
      setSaveStatus("error");
    }
  };

  const handleLoginError = () => {
    console.warn("Đăng nhập Google thất bại hoặc user đã hủy.");
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

  // ── TẠO BỘ TỪ VỰNG ───────────────────────────────────────
  // FIX: Gửi userEmail theo tài khoản; dùng res.data (MongoDB _id thật).
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
      setTimeout(() => setSaveStatus(""), 3000);
    }
  };

  // ── XÓA BỘ TỪ VỰNG ───────────────────────────────────────
  const handleDeleteDeck = async (deckId, e) => {
    e?.stopPropagation();
    if (!window.confirm("Bạn có chắc muốn xóa toàn bộ bộ từ vựng này không?"))
      return;
    try {
      setSaveStatus("saving");
      // Gửi userEmail để backend kiểm tra quyền xóa (FIX BUG 5 phía client)
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

  // ── THÊM THẺ TỪ ──────────────────────────────────────────
  // FIX: Dùng endpoint PUT /decks/:id/cards (thêm 1 thẻ)
  // thay vì ghi đè toàn bộ array => an toàn hơn, không race condition.
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
      // Fallback: nếu backend chưa có route /cards, dùng PUT toàn bộ deck
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

  // ── XÓA THẺ TỪ ───────────────────────────────────────────
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

  // ── CHECKLIST "Đã học" ────────────────────────────────────
  // Tự động tạo / tìm bộ "Đã học ✅" và thêm thẻ vào đó.
  const handleMarkAsLearned = async (card) => {
    if (!user) {
      alert("Vui lòng đăng nhập để lưu từ này vào danh sách 'Đã học' nhé!");
      return;
    }
    if (!card) return;
    try {
      setSaveStatus("saving");

      // Tìm bộ "Đã học ✅" của user này
      let learnedDeck = decks.find(
        (d) => d.title === "Đã học ✅" && d.userEmail === user.email
      );

      // Nếu chưa tồn tại → tạo mới
      if (!learnedDeck) {
        const createRes = await axios.post(API_URL, {
          title: "Đã học ✅",
          userEmail: user.email,
          cards: [],
        });
        learnedDeck = createRes.data;
        setDecks((prev) => [...prev, learnedDeck]);
      }

      // Kiểm tra đã tồn tại chưa
      const alreadyIn = (learnedDeck.cards || []).some(
        (c) => c.korean === card.korean
      );
      if (alreadyIn) {
        alert("Từ này đã nằm trong bộ Đã học rồi!");
        setSaveStatus("");
        return;
      }

      // Thêm vào bộ đã học
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
      // Fallback PUT nếu route /cards chưa tồn tại
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

  // ── RENDER TRẠNG THÁI ĐỒNG BỘ ────────────────────────────
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
  //  RENDER
  // ════════════════════════════════════════════════════════════
  return (
    /*
     * 🎨 [MÀU NỀN TRANG]
     * Đổi "from-pink-100 via-purple-50 to-indigo-100" thành màu bạn muốn.
     * Ví dụ pastel xanh: "from-sky-100 via-cyan-50 to-teal-100"
     * Ví dụ trắng thuần:  "from-white to-gray-50"
     */
    <div className="relative min-h-screen overflow-x-hidden selection:bg-pink-200 bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100">
      {/* ── BUBBLE GRADIENT THEO CHUỘT ────────────────────────
       * 🎨 [MÀU BUBBLE GRADIENT]
       * Đổi "rgba(255,182,193,0.45)" thành màu bong bóng khác.
       * Ví dụ: xanh dương nhạt = rgba(147,197,253,0.4)
       */}
      <div
        ref={cursorRef}
        className="pointer-events-none fixed top-0 left-0 z-0 w-[500px] h-[500px] rounded-full hidden md:block will-change-transform"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,182,193,0.45) 0%, rgba(196,181,253,0.2) 40%, transparent 70%)",
          filter: "blur(40px)",
          transform: "translate3d(-999px,-999px,0) translate(-50%,-50%)",
          transition: "transform 0.08s linear",
        }}
      />

      {/* ── WELCOME MODAL ─────────────────────────────────────
       * 🎨 [MÀU WELCOME MODAL]
       * "bg-white/55" → nền kính của modal.
       * "from-pink-400 to-purple-500" → nút "Học luôn".
       * "text-pink-500" → tiêu đề "Annyeonghaseyo 🌸".
       */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-md">
          <div
            className="animate-fade-in glass border border-white/60 p-8 rounded-3xl shadow-2xl max-w-md w-11/12 text-center relative"
            style={{ background: "rgba(255,255,255,0.55)" }}
          >
            {/* 🎨 [MÀU TIÊU ĐỀ WELCOME] — Đổi "text-pink-500" */}
            <h2 className="text-3xl md:text-4xl font-black mb-4 text-pink-500 font-title tracking-wider">
              Annyeonghaseyo! 🌸
            </h2>
            <p className="text-gray-600 mb-8 text-base leading-relaxed font-medium">
              Chào mừng bạn đã quay trở lại không gian học tập. Hệ thống cơ sở
              dữ liệu đã sẵn sàng, bạn muốn cưới gái cosplay chứ 🥰
            </p>

            {/* Nút Google Sign In trong modal (chưa đăng nhập) */}
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
              {/* 🎨 [MÀU NÚT "Học luôn"] — Đổi "from-pink-400 to-purple-500" */}
              <button
                onClick={() => setShowWelcome(false)}
                className="px-8 py-3 bg-gradient-to-r from-pink-400 to-purple-500 text-white rounded-full font-bold hover:opacity-95 hover:scale-105 transition-all shadow-md shadow-purple-200"
              >
                học để đổi vận mệnh 🔥 ✨
              </button>
              <button
                onClick={() => {
                  alert("Từ chối không được đâu nhé, học tập chăm chỉ đi nào!");
                  setShowWelcome(false);
                }}
                className="px-6 py-3 bg-white/60 text-gray-700 rounded-full font-semibold hover:bg-white/90 transition-all border border-gray-200"
              >
                đéo mún học
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST TRẠNG THÁI (góc phải) ─────────────────────── */}
      {saveStatus && (
        <div className="fixed top-4 right-4 z-40 glass border border-white/60 px-4 py-2.5 rounded-full shadow-lg">
          {renderSaveStatus()}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          NỘI DUNG CHÍNH
         ════════════════════════════════════════════════════ */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6">
        {/* ── HEADER BAR ──────────────────────────────────────
         * 🎨 [MÀU HEADER BAR]
         * "bg-white/45" → nền kính header.
         * Đổi "from-pink-500 to-purple-600" để đổi màu chữ logo.
         */}
        <header
          className="flex justify-between items-center mb-10 glass border border-white/50 px-5 py-3 rounded-2xl shadow-sm"
          style={{ background: "rgba(255,255,255,0.45)" }}
        >
          {/* Logo + status */}
          <div className="flex items-center gap-4 flex-wrap">
            <h1
              onClick={() => setCurrentView("home")}
              className="cursor-pointer text-2xl md:text-3xl font-black font-title text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 flex items-center gap-2 select-none"
            >
              {/* 🎨 [MÀU TIÊU ĐỀ] — Đổi "from-pink-500 to-purple-600" */}
              <Sparkles size={22} className="text-pink-400" />
              K-VOCAB STUDY LAB
            </h1>
            <div className="hidden md:block">{renderSaveStatus()}</div>
          </div>

          {/* Khu vực đăng nhập Google */}
          <div className="flex items-center gap-3">
            {!user ? (
              /* 🎨 [MÀU NÚT SIGN IN] — Đây là button Google chuẩn, không custom được màu */
              <div className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <GoogleLogin
                  onSuccess={handleLoginSuccess}
                  onError={handleLoginError}
                  useOneTap
                />
              </div>
            ) : (
              /* 🎨 [MÀU KHUNG USER] — "bg-white/60" nền kính, "text-purple-950" tên */
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
                  title="Đăng xuất"
                >
                  <LogOut size={13} />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </header>

        {/* ════════════════════════════════════════════════════
            VIEW 1: HOME — DANH SÁCH BỘ TỪ VỰNG
           ════════════════════════════════════════════════════ */}
        {currentView === "home" && (
          <div className="space-y-8 animate-fade-in">
            {/* Ô nhập tên bộ từ mới */}
            {/*
             * 🎨 [MÀU INPUT]
             * "bg-white/80" → nền input. "focus:ring-purple-400" → viền focus.
             * 🎨 [MÀU NÚT TẠO BỘ TỪ]
             * "from-pink-400 to-purple-500" → gradient nút.
             */}
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
              >
                <Plus size={20} /> Tạo bộ từ
              </button>
            </div>

            {/* Grid các bộ từ vựng */}
            {decks.length === 0 ? (
              <div className="text-center py-16 text-gray-500 font-medium glass rounded-2xl border border-white/40">
                <p className="text-2xl mb-2">📚</p>
                Chưa có dữ liệu. Tạo bộ từ mới ở trên để bắt đầu!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {decks.map((deck) => (
                  /*
                   * 🎨 [MÀU KHUNG BỘ TỪ VỰNG]
                   * "bg-white/40" → nền kính. Thêm className khác để tùy chỉnh.
                   * Ví dụ nền xanh nhạt: "bg-blue-50/60"
                   * Viền: "border-white/40" → đổi "border-pink-200" cho màu hồng.
                   * Tiêu đề deck: "text-gray-900" → đổi "text-purple-900".
                   */
                  <div
                    key={deck._id}
                    onClick={() => {
                      setActiveDeckId(deck._id);
                      setCurrentView("study");
                      setCardIndex(0);
                      setIsFlipped(false);
                    }}
                    className="glass group relative p-6 rounded-2xl cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-white/40 flex flex-col justify-between overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.42)" }}
                  >
                    {/* Decorative blur blob */}
                    <div
                      className="absolute -top-6 -right-6 w-28 h-28 rounded-full pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(251,182,213,0.35) 0%, transparent 70%)",
                      }}
                    />

                    <div>
                      {/* 🎨 [MÀU TÊN BỘ TỪ] — "text-gray-900", hover "text-purple-700" */}
                      <h3 className="text-xl font-bold text-gray-900 mb-2 font-title line-clamp-2 pr-6 group-hover:text-purple-700 transition-colors">
                        {deck.title}
                      </h3>
                      {/* 🎨 [MÀU SỐ LƯỢNG THẺ] — "text-pink-500" */}
                      <p className="text-sm font-semibold text-pink-500 flex items-center gap-1.5 bg-white/40 px-3 py-1 rounded-full w-max">
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
                      >
                        Sửa thẻ
                      </button>
                      <button
                        onClick={(e) => handleDeleteDeck(deck._id, e)}
                        className="p-2 bg-white/70 hover:bg-red-50 text-red-500 rounded-xl transition-all border border-white shadow-sm"
                        title="Xóa bộ từ"
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

        {/* ════════════════════════════════════════════════════
            VIEW 2: STUDY — CHẾ ĐỘ HỌC FLASHCARD
           ════════════════════════════════════════════════════ */}
        {currentView === "study" && activeDeck && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            {/* Thanh điều hướng trên */}
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

            {/* Tiêu đề & bộ đếm */}
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

            {/* Flashcard */}
            {activeDeck.cards?.length === 0 ? (
              <div className="glass p-12 rounded-3xl text-center text-gray-500 font-medium border border-white/50 shadow-md">
                <p className="text-3xl mb-3">🌸</p>
                Bộ từ này chưa có thẻ nào cả!
                <br />
                <button
                  onClick={() => setCurrentView("edit")}
                  className="mt-4 px-6 py-2 bg-gradient-to-r from-pink-400 to-purple-500 text-white rounded-full font-bold hover:opacity-90 transition shadow-md"
                >
                  Thêm thẻ mới
                </button>
              </div>
            ) : (
              <>
                {/*
                 * FLASHCARD 3D — sử dụng rotateX (lật theo trục ngang)
                 * như trong App.jsx mới (mượt hơn rotateY của oldbutnogg).
                 *
                 * 🎨 [MÀU FLASHCARD MẶT TRƯỚC]
                 * "bg-white/60" → nền kính mặt trước.
                 * Đổi thành "bg-pink-50/80" cho tông hồng.
                 *
                 * 🎨 [MÀU FLASHCARD MẶT SAU]
                 * "from-pink-50 to-purple-100" → gradient mặt sau.
                 */}
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
                    {/* MẶT TRƯỚC: Tiếng Hàn */}
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center rounded-[2rem] shadow-xl border border-white/70 p-8 text-center select-none"
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        /* 🎨 [MÀU FLASHCARD MẶT TRƯỚC] ↓↓↓ */
                        background: "rgba(255, 255, 255, 0.65)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                      }}
                    >
                      {/* 🎨 [MÀU CHỮ TIẾNG HÀN] — Đổi "#a855f7" thành mã màu khác */}
                      <span
                        className="font-title font-black tracking-wide mb-3 drop-shadow-sm"
                        style={{
                          fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
                          color: "#a855f7",
                        }}
                      >
                        {activeDeck.cards[cardIndex]?.korean}
                      </span>
                      {activeDeck.cards[cardIndex]?.romaji && (
                        <span className="text-lg md:text-2xl text-gray-400 font-bold tracking-widest uppercase">
                          [{activeDeck.cards[cardIndex].romaji}]
                        </span>
                      )}
                      <p className="absolute bottom-5 text-xs text-gray-300 font-medium tracking-wider">
                        Click để xem nghĩa →
                      </p>
                    </div>

                    {/* MẶT SAU: Tiếng Việt */}
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center rounded-[2rem] shadow-xl border border-white/70 p-8 text-center select-none"
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transform: "rotateX(180deg)",
                        /* 🎨 [MÀU FLASHCARD MẶT SAU] ↓↓↓ */
                        background:
                          "linear-gradient(135deg, #fff0f8 0%, #ede9fe 100%)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                      }}
                    >
                      {activeDeck.cards[cardIndex]?.romaji && (
                        /* 🎨 [MÀU PHIÊN ÂM MẶT SAU] — "text-purple-400" */
                        <p className="text-sm font-bold tracking-widest uppercase text-purple-400 mb-3">
                          [{activeDeck.cards[cardIndex].romaji}]
                        </p>
                      )}
                      {/* 🎨 [MÀU CHỮ TIẾNG VIỆT] — "text-gray-900", font-title */}
                      <p className="text-3xl md:text-4xl font-black text-gray-900 font-title mb-5">
                        {activeDeck.cards[cardIndex]?.viet}
                      </p>
                      {activeDeck.cards[cardIndex]?.note && (
                        /* 🎨 [MÀU GHI CHÚ MẶT SAU] — "bg-white/60", "text-gray-600" */
                        <p className="text-sm bg-white/60 px-5 py-2.5 rounded-2xl text-gray-600 max-w-md italic border border-white/70 shadow-sm">
                          💡 {activeDeck.cards[cardIndex].note}
                        </p>
                      )}
                      <p className="absolute bottom-5 text-xs text-gray-300 font-medium tracking-wider">
                        ← Click để lật lại
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hướng dẫn lật */}
                <p className="text-center text-xs font-bold text-gray-400 tracking-wider -mt-2">
                  {isFlipped
                    ? "← Click để lật lại mặt trước"
                    : "Click để xem nghĩa →"}
                </p>

                {/*
                 * THANH ĐIỀU HƯỚNG: ← | Checklist ✅ | Reset | →
                 *
                 * 🎨 [MÀU NÚT MŨI TÊN]
                 * "bg-white hover:bg-purple-50 text-purple-700"
                 * → đổi "hover:bg-pink-50 text-pink-600" nếu muốn hồng.
                 *
                 * 🎨 [MÀU NÚT CHECKLIST]
                 * "bg-green-100/80 text-green-600 border-green-200"
                 * → đổi sang "bg-pink-100 text-pink-500 border-pink-200" nếu muốn hồng.
                 */}
                <div className="flex justify-center items-center gap-4 mt-4">
                  {/* Nút Lùi */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCardIndex((p) => Math.max(0, p - 1));
                      setIsFlipped(false);
                    }}
                    disabled={cardIndex === 0}
                    className="p-3.5 bg-white hover:bg-purple-50 rounded-full shadow-md disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 text-purple-700 border border-gray-100"
                    title="Thẻ trước"
                  >
                    <ArrowLeft size={22} />
                  </button>

                  {/* Nút Reset (học lại từ đầu) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCardIndex(0);
                      setIsFlipped(false);
                    }}
                    className="p-3.5 bg-white hover:bg-purple-50 rounded-full shadow-md transition-all active:scale-95 text-gray-400 border border-gray-100"
                    title="Học lại từ đầu"
                  >
                    <RotateCcw size={20} />
                  </button>

                  {/*
                   * NÚT CHECKLIST "Đã học"
                   * 🎨 [MÀU NÚT CHECKLIST] — thay className bên dưới
                   */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsLearned(activeDeck.cards[cardIndex]);
                    }}
                    className="p-3.5 bg-green-100/80 hover:bg-green-200 border border-green-200 text-green-600 rounded-full shadow-md transition-all active:scale-95 hover:scale-110"
                    title="Đánh dấu Đã học — lưu vào bộ 'Đã học ✅'"
                  >
                    <CheckSquare size={22} />
                  </button>

                  {/* Nút Tiến */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCardIndex((p) =>
                        Math.min(activeDeck.cards.length - 1, p + 1)
                      );
                      setIsFlipped(false);
                    }}
                    disabled={cardIndex === activeDeck.cards.length - 1}
                    className="p-3.5 bg-white hover:bg-purple-50 rounded-full shadow-md disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 text-purple-700 border border-gray-100"
                    title="Thẻ tiếp"
                  >
                    <ArrowRight size={22} />
                  </button>
                </div>

                {/* Chú thích nút checklist */}
                <p className="text-center text-xs text-gray-400 -mt-1">
                  ✅ = Lưu vào bộ "Đã học" · cần đăng nhập để sync
                </p>
              </>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            VIEW 3: EDIT — QUẢN LÝ & THÊM THẺ TỪ
           ════════════════════════════════════════════════════ */}
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

            {/*
             * FORM THÊM THẺ TỪ MỚI
             * 🎨 [MÀU KHUNG FORM EDIT] — "bg-white/50" nền kính
             * 🎨 [MÀU INPUT] — "bg-white/60 focus:ring-pink-300"
             */}
            <div
              className="glass p-6 rounded-2xl border border-white/50 space-y-4 shadow-md"
              style={{ background: "rgba(255,255,255,0.50)" }}
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
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-purple-400 font-title text-xl text-gray-800 placeholder-gray-300"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium text-gray-700 placeholder-gray-300"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium text-lg text-gray-800 placeholder-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1 tracking-wide">
                    Ghi chú / Ví dụ
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 사과를 좋아해요"
                    value={newCard.note}
                    onChange={(e) =>
                      setNewCard({ ...newCard, note: e.target.value })
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleAddCard()}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium text-gray-700 placeholder-gray-300"
                  />
                </div>
              </div>

              {/*
               * 🎨 [MÀU NÚT LƯU THẺ]
               * "from-purple-500 to-pink-500" → đổi gradient tùy ý
               */}
              <button
                onClick={handleAddCard}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md hover:opacity-95 active:scale-[0.99] transition-all mt-2"
              >
                <Plus size={18} /> Thêm thẻ vào bộ (Auto-save DB)
              </button>
            </div>

            {/* DANH SÁCH THẺ TỪ ĐÃ CÓ */}
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
                    /*
                     * 🎨 [MÀU DANH SÁCH TỪ]
                     * "bg-white/60" → nền kính mỗi hàng
                     * "text-purple-900" → màu chữ tiếng Hàn
                     * "text-gray-800 font-title" → màu nghĩa tiếng Việt
                     */
                    <div
                      key={card._id || card.id || index}
                      className="glass px-5 py-4 rounded-xl flex items-center justify-between gap-4 border border-white/40 hover:bg-white/55 transition-all"
                      style={{ background: "rgba(255,255,255,0.48)" }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-6 flex-1 items-center">
                        {/* 🎨 [MÀU CHỮ HÀN TRONG DANH SÁCH] */}
                        <span className="text-xl font-black text-purple-900 font-title">
                          {card.korean}
                        </span>
                        {/* 🎨 [MÀU PHIÊN ÂM TRONG DANH SÁCH] */}
                        {card.romaji ? (
                          <span className="text-sm text-gray-400 font-bold tracking-wide">
                            [{card.romaji}]
                          </span>
                        ) : (
                          <span className="hidden md:inline text-gray-300">
                            —
                          </span>
                        )}
                        {/* 🎨 [MÀU NGHĨA TIẾNG VIỆT TRONG DANH SÁCH] */}
                        <span className="text-base font-bold text-gray-800 font-title">
                          {card.viet}
                        </span>
                      </div>

                      {card.note && (
                        <div className="hidden lg:block text-xs text-gray-400 bg-white/50 px-3 py-1.5 rounded-lg max-w-xs truncate border border-white/40">
                          {card.note}
                        </div>
                      )}

                      <button
                        onClick={() => handleDeleteCard(card._id || card.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa thẻ từ"
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
//  CHANGELOG & GHI CHÚ KỸ THUẬT
// ════════════════════════════════════════════════════════════
//
//  [FIX 1] Sign-in persist:
//    - Dùng localStorage key "kvocab_user" để lưu user object.
//    - useState initializer đọc từ localStorage ngay lúc mount.
//    - handleLogout xóa cả state lẫn localStorage.
//
//  [FIX 2] Database / data không mất khi reload:
//    - fetchDecks lọc theo ?userEmail= nên mỗi tài khoản chỉ thấy
//      dữ liệu của họ.
//    - handleCreateDeck truyền userEmail vào payload → backend gắn
//      đúng owner; dùng res.data (MongoDB _id thật) chứ không tự tạo.
//    - handleAddCard ưu tiên PUT /decks/:id/cards (endpoint thêm 1 thẻ
//      an toàn); nếu backend chưa có route đó thì fallback PUT toàn deck.
//    - handleDeleteCard giữ nguyên cách PUT toàn bộ mảng sau khi lọc.
//
//  [TÍNH NĂNG MỚI] Nút Checklist "Đã học":
//    - Nằm ngang hàng với ← Reset → (giữa Reset và → ).
//    - Tự tạo deck "Đã học ✅" nếu chưa tồn tại.
//    - Kiểm tra trùng trước khi thêm.
//    - Có fallback PUT nếu backend thiếu route /cards.
//    - Yêu cầu đăng nhập (user !== null).
//
//  [GIAO DIỆN] Glassmorphism pink-pastel:
//    - Nền gradient from-pink-100 via-purple-50 to-indigo-100.
//    - Bubble gradient lan theo chuột (ref + translate3d).
//    - Class .glass = rgba white/45 + backdrop-blur(18px).
//    - Flashcard dùng rotateX(180deg) (lật theo trục ngang) thay vì Y.
//    - Font .font-title → khai báo @font-face trong index.css với file OTF.
//    - Màu sắc custom: tìm 🎨 trong code để đổi nhanh.
//
//  [BACKEND YÊU CẦU]
//    - GET    /api/decks?userEmail=xxx
//    - POST   /api/decks           { title, userEmail, cards }
//    - PUT    /api/decks/:id       { ...deck, cards }
//    - PUT    /api/decks/:id/cards { korean, romaji, viet, note }   ← thêm 1 thẻ
//    - DELETE /api/decks/:id
//    Schema Deck: { title, userEmail, cards: [{ korean, romaji, viet, note }] }
// ════════════════════════════════════════════════════════════
