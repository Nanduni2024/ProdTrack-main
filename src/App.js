import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  CalendarDays,
  Cloud,
  Download,
  Eye,
  Feather,
  FileUp,
  ImagePlus,
  LayoutDashboard,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  UserRound
} from "lucide-react";

const STORAGE_KEY = "prodtrack_articles";
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const SUPABASE_ARTICLES_ENDPOINT = SUPABASE_URL
  ? `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/articles`
  : "";

const starterArticles = [
  {
    id: "founders-note",
    title: "Building Better Workflows With Clear Product Thinking",
    category: "Product",
    author: "ProdTrack Editorial",
    excerpt:
      "A practical note on turning scattered ideas into a repeatable rhythm for planning, writing, shipping, and learning.",
    body:
      "Great product work rarely begins with a perfect plan. It begins with clear notes, focused experiments, and the discipline to turn each lesson into the next useful article. ProdTrack Journal is built for that rhythm: write what matters, publish with intent, and keep a polished archive that feels personal without feeling casual.",
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80",
    createdAt: "2026-05-17T08:30:00.000Z",
    readTime: "4 min read",
    featured: true
  },
  {
    id: "content-systems",
    title: "Why Personal Knowledge Needs a Publishing Habit",
    category: "Writing",
    author: "Maya Perera",
    excerpt:
      "A calm writing system helps ideas mature from private drafts into useful public essays.",
    body:
      "The best personal websites act like a studio, not a billboard. They make it easy to capture a thought, shape it into a post, and give readers a focused place to return. When publishing is simple, writing becomes a practice instead of a project you keep postponing.",
    image:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1400&q=80",
    createdAt: "2026-05-12T10:00:00.000Z",
    readTime: "3 min read",
    featured: false
  }
];

const emptyForm = {
  title: "",
  category: "",
  author: "Admin",
  excerpt: "",
  body: "",
  image: ""
};

function getStoredArticles() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : starterArticles;
  } catch {
    return starterArticles;
  }
}

function saveStoredArticles(articles) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
  } catch {
    // Uploaded base64 images can exceed browser storage. Cloud storage is preferred for production.
  }
}

function cloudStorageEnabled() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function normalizeArticle(article) {
  return {
    id: article.id,
    title: article.title,
    category: article.category,
    author: article.author,
    excerpt: article.excerpt,
    body: article.body,
    image: article.image,
    createdAt: article.createdAt || article.created_at,
    readTime: article.readTime || article.read_time,
    featured: Boolean(article.featured)
  };
}

function toSupabaseArticle(article) {
  return {
    id: article.id,
    title: article.title,
    category: article.category,
    author: article.author,
    excerpt: article.excerpt,
    body: article.body,
    image: article.image,
    created_at: article.createdAt,
    read_time: article.readTime,
    featured: article.featured
  };
}

async function requestSupabase(path = "", options = {}) {
  const response = await fetch(`${SUPABASE_ARTICLES_ENDPOINT}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error(`Supabase request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function calculateReadTime(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 180))} min read`;
}

function App() {
  const [articles, setArticles] = useState(getStoredArticles);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(articles[0]?.id || "");
  const [mode, setMode] = useState("reader");
  const [form, setForm] = useState(emptyForm);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [storageStatus, setStorageStatus] = useState(
    cloudStorageEnabled()
      ? "Connecting to shared cloud articles..."
      : "This device only. Add Supabase on Vercel to share posts."
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!cloudStorageEnabled()) return;

    let ignore = false;

    async function loadCloudArticles() {
      try {
        const data = await requestSupabase("?select=*&order=created_at.desc");
        if (ignore) return;
        const nextArticles = data.map(normalizeArticle);
        setArticles(nextArticles.length ? nextArticles : starterArticles);
        setSelectedId(nextArticles[0]?.id || starterArticles[0].id);
        setStorageStatus("Cloud sync active");
      } catch {
        if (!ignore) {
          setStorageStatus("Cloud unavailable. Showing this device only.");
        }
      }
    }

    loadCloudArticles();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    saveStoredArticles(articles);
  }, [articles]);

  const filteredArticles = useMemo(() => {
    const term = query.toLowerCase();
    return articles.filter((article) =>
      [article.title, article.category, article.author, article.excerpt]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [articles, query]);

  const selectedArticle =
    articles.find((article) => article.id === selectedId) || filteredArticles[0] || articles[0];

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 1500000) {
      setStorageStatus("Please upload an image smaller than 1.5 MB");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => updateField("image", reader.result);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;

    const article = {
      ...form,
      id: `${Date.now()}-${form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      category: form.category || "Essay",
      excerpt: form.excerpt || form.body.slice(0, 150),
      image:
        form.image ||
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1400&q=80",
      createdAt: new Date().toISOString(),
      readTime: calculateReadTime(form.body),
      featured: articles.length === 0
    };

    setIsSaving(true);

    if (cloudStorageEnabled()) {
      try {
        await requestSupabase("", {
          method: "POST",
          body: JSON.stringify(toSupabaseArticle(article))
        });
        setStorageStatus("Article published to cloud");
      } catch {
        setStorageStatus("Cloud save failed. Saved on this device only.");
      }
    }

    setArticles((current) => [article, ...current]);
    setSelectedId(article.id);
    setMode("reader");
    setForm(emptyForm);
    setIsSaving(false);
  }

  async function deleteArticle(id) {
    if (cloudStorageEnabled()) {
      try {
        await requestSupabase(`?id=eq.${encodeURIComponent(id)}`, {
          method: "DELETE"
        });
        setStorageStatus("Article deleted from cloud");
      } catch {
        setStorageStatus("Cloud delete failed. Removed on this device only.");
      }
    }

    setArticles((current) => current.filter((article) => article.id !== id));
    if (selectedId === id) {
      setSelectedId(articles.find((article) => article.id !== id)?.id || "");
    }
  }

  function handleExportArticles() {
    const exportData = JSON.stringify(articles, null, 2);
    const blob = new Blob([exportData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `prodtrack-posts-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStorageStatus("Posts exported from this browser");
  }

  async function handleImportArticles(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedText = await file.text();
      const importedArticles = JSON.parse(importedText).map(normalizeArticle);
      const articleMap = new Map();

      [...importedArticles, ...articles].forEach((article) => {
        if (article?.id && article?.title && article?.body) {
          articleMap.set(article.id, article);
        }
      });

      const nextArticles = Array.from(articleMap.values()).sort(
        (first, second) => new Date(second.createdAt) - new Date(first.createdAt)
      );

      if (cloudStorageEnabled()) {
        await requestSupabase("", {
          method: "POST",
          headers: {
            Prefer: "resolution=merge-duplicates,return=representation"
          },
          body: JSON.stringify(importedArticles.map(toSupabaseArticle))
        });
      }

      setArticles(nextArticles);
      setSelectedId(nextArticles[0]?.id || "");
      setStorageStatus(
        cloudStorageEnabled()
          ? "Imported posts and synced to cloud"
          : "Imported posts on this device"
      );
    } catch {
      setStorageStatus("Import failed. Use a ProdTrack posts JSON file.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <main className="app-shell">
      <nav className="topbar">
        <button className="brand" onClick={() => setMode("reader")}>
          <span className="brand-mark">
            <Feather size={20} />
          </span>
          <span>
            <strong>ProdTrack</strong>
            <small>Journal</small>
          </span>
        </button>

        <div className="nav-actions">
          <button
            className={mode === "reader" ? "nav-button active" : "nav-button"}
            onClick={() => setMode("reader")}
          >
            <BookOpen size={18} />
            Read
          </button>
          <button
            className={mode === "admin" ? "nav-button active" : "nav-button"}
            onClick={() => setMode("admin")}
          >
            <LayoutDashboard size={18} />
            Admin
          </button>
        </div>
      </nav>

      {mode === "reader" ? (
        <ReaderView
          articles={filteredArticles}
          query={query}
          selectedArticle={selectedArticle}
          selectedId={selectedArticle?.id}
          storageStatus={storageStatus}
          setQuery={setQuery}
          setSelectedId={setSelectedId}
        />
      ) : (
        <>
          {adminUnlocked ? (
            <AdminView
              articles={articles}
              form={form}
              isSaving={isSaving}
              storageStatus={storageStatus}
              deleteArticle={deleteArticle}
              handleExportArticles={handleExportArticles}
              handleImportArticles={handleImportArticles}
              handleImageUpload={handleImageUpload}
              handleSubmit={handleSubmit}
              updateField={updateField}
            />
          ) : (
            <AdminLogin
              adminPin={adminPin}
              setAdminPin={setAdminPin}
              unlock={() => {
                if (adminPin === "prodtrack2026") {
                  setAdminUnlocked(true);
                  setAdminPin("");
                }
              }}
            />
          )}
        </>
      )}
    </main>
  );
}

function AdminLogin({ adminPin, setAdminPin, unlock }) {
  return (
    <section className="admin-login">
      <form
        className="login-panel"
        onSubmit={(event) => {
          event.preventDefault();
          unlock();
        }}
      >
        <div className="section-title">
          <span>
            <LayoutDashboard size={18} />
            Admin access
          </span>
          <strong>Publisher login</strong>
        </div>
        <label>
          Admin PIN
          <input
            value={adminPin}
            onChange={(event) => setAdminPin(event.target.value)}
            placeholder="Enter publisher PIN"
            type="password"
          />
        </label>
        <button className="publish-button" type="submit">
          <Plus size={18} />
          Open publisher
        </button>
      </form>
    </section>
  );
}

function ReaderView({
  articles,
  query,
  selectedArticle,
  selectedId,
  storageStatus,
  setQuery,
  setSelectedId
}) {
  return (
    <section className="reader-grid">
      <aside className="story-rail">
        <div className="search-box">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search articles"
          />
        </div>

        <div className="rail-heading">
          <span>Latest writing</span>
          <strong>{articles.length}</strong>
        </div>

        <div className="sync-badge">
          <Cloud size={16} />
          <span>{storageStatus}</span>
        </div>

        <div className="article-list">
          {articles.map((article) => (
            <button
              className={selectedId === article.id ? "article-card active" : "article-card"}
              key={article.id}
              onClick={() => setSelectedId(article.id)}
            >
              <span className="chip">{article.category}</span>
              <strong>{article.title}</strong>
              <small>{article.excerpt}</small>
            </button>
          ))}
        </div>
      </aside>

      {selectedArticle ? (
        <motion.article
          className="story-stage"
          key={selectedArticle.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="hero-image">
            <img src={selectedArticle.image} alt="" />
          </div>

          <div className="story-content">
            <div className="story-kicker">
              <span>{selectedArticle.category}</span>
              <span>{selectedArticle.readTime}</span>
            </div>
            <h1>{selectedArticle.title}</h1>
            <p className="lede">{selectedArticle.excerpt}</p>

            <div className="byline">
              <span>
                <UserRound size={17} />
                {selectedArticle.author}
              </span>
              <span>
                <CalendarDays size={17} />
                {formatDate(selectedArticle.createdAt)}
              </span>
            </div>

            <p className="article-body">{selectedArticle.body}</p>
          </div>
        </motion.article>
      ) : (
        <section className="empty-state">
          <BookOpen size={34} />
          <h1>No articles found</h1>
          <p>Try another search term or publish a new article from the admin area.</p>
        </section>
      )}
    </section>
  );
}

function AdminView({
  articles,
  form,
  isSaving,
  storageStatus,
  deleteArticle,
  handleExportArticles,
  handleImportArticles,
  handleImageUpload,
  handleSubmit,
  updateField
}) {
  return (
    <section className="admin-grid">
      <form className="editor-panel" onSubmit={handleSubmit}>
        <div className="section-title">
          <span>
            <Sparkles size={18} />
            Admin publisher
          </span>
          <strong>Add article</strong>
        </div>

        <div className="sync-badge editor-status">
          <Cloud size={16} />
          <span>{storageStatus}</span>
        </div>

        <div className="portable-actions">
          <button type="button" onClick={handleExportArticles}>
            <Download size={17} />
            Export posts
          </button>
          <label>
            <FileUp size={17} />
            Import posts
            <input accept="application/json" type="file" onChange={handleImportArticles} />
          </label>
        </div>

        <label>
          Title
          <input
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="Write a strong article title"
            required
          />
        </label>

        <div className="split-fields">
          <label>
            Category
            <input
              value={form.category}
              onChange={(event) => updateField("category", event.target.value)}
              placeholder="Design, Product, Life"
            />
          </label>
          <label>
            Author
            <input
              value={form.author}
              onChange={(event) => updateField("author", event.target.value)}
              placeholder="Author name"
            />
          </label>
        </div>

        <label>
          Short summary
          <textarea
            rows="3"
            value={form.excerpt}
            onChange={(event) => updateField("excerpt", event.target.value)}
            placeholder="A preview users will see before opening the article"
          />
        </label>

        <label>
          Article body
          <textarea
            rows="9"
            value={form.body}
            onChange={(event) => updateField("body", event.target.value)}
            placeholder="Write the full post here"
            required
          />
        </label>

        <label className="upload-box">
          <ImagePlus size={22} />
          <span>{form.image ? "Image attached" : "Upload cover image"}</span>
          <input accept="image/*" type="file" onChange={handleImageUpload} />
        </label>

        {form.image && (
          <div className="image-preview">
            <img src={form.image} alt="" />
          </div>
        )}

        <button className="publish-button" disabled={isSaving} type="submit">
          <Upload size={18} />
          {isSaving ? "Publishing..." : "Publish article"}
        </button>
      </form>

      <aside className="admin-list">
        <div className="section-title">
          <span>
            <Eye size={18} />
            Published
          </span>
          <strong>{articles.length} posts</strong>
        </div>

        {articles.map((article) => (
          <div className="admin-row" key={article.id}>
            <img src={article.image} alt="" />
            <div>
              <span>{article.category}</span>
              <strong>{article.title}</strong>
              <small>{formatDate(article.createdAt)}</small>
            </div>
            <button aria-label={`Delete ${article.title}`} onClick={() => deleteArticle(article.id)}>
              <Trash2 size={17} />
            </button>
          </div>
        ))}
      </aside>
    </section>
  );
}

export default App;
