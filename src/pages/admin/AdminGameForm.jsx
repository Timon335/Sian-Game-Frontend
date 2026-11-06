import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { ErrorBox, Loading, btnGhost, btnPrimary, inputClass } from '../../components/admin/AdminStates';
import { createGame, getAdminGame, getGenres, updateGame } from '../../api/backend';

const EMPTY = { title: '', description: '', developer: '', releaseDate: '', price: '', cover: '', genreIds: [], screenshots: '', isActive: true };

// ตรวจชั้นแรกในเบราว์เซอร์ กติกาเดียวกับ readGame ใน Go ซึ่งตรวจซ้ำเสมอเพราะฟอร์มนี้ข้ามได้
function validate(f) {
  const errs = {};
  if (!f.title.trim()) errs.title = 'ต้องมีชื่อเกม';
  if (!f.description.trim()) errs.description = 'ต้องมีคำอธิบาย';
  if (!f.developer.trim()) errs.developer = 'ต้องมีชื่อผู้พัฒนา';
  if (!(Number(f.price) > 0)) errs.price = 'ราคาต้องมากกว่า 0';
  if (!/^https?:\/\/\S+$/.test(f.cover.trim())) errs.cover = 'ต้องเป็นลิงก์ที่ขึ้นต้นด้วย http:// หรือ https://';
  if (f.genreIds.length === 0) errs.genreIds = 'ต้องเลือกแนวเกมอย่างน้อย 1 แนว';
  return errs;
}

function toPayload(f, isEdit) {
  const payload = {
    title: f.title.trim(),
    description: f.description.trim(),
    developer: f.developer.trim(),
    releaseDate: f.releaseDate || null,
    price: Number(f.price),
    cover: f.cover.trim(),
    genreIds: f.genreIds,
    screenshots: f.screenshots.split('\n').map((s) => s.trim()).filter(Boolean),
  };
  if (isEdit) payload.isActive = f.isActive;
  return payload;
}

function AdminGameForm() {
  const { id } = useParams(); // undefined = โหมดเพิ่ม
  const isEdit = Boolean(id);
  const { token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [genres, setGenres] = useState([]);
  const [status, setStatus] = useState('loading');
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setStatus('loading');
      try {
        const [genreList, game] = await Promise.all([getGenres(), isEdit ? getAdminGame(id, token) : null]);
        if (ignore) return;
        setGenres(genreList);
        if (game) {
          setForm({
            title: game.title,
            description: game.description,
            developer: game.developer,
            releaseDate: game.releaseDate ?? '',
            price: String(game.price),
            cover: game.cover,
            genreIds: genreList.filter((g) => game.genres.includes(g.name)).map((g) => g.id),
            screenshots: game.screenshots.join('\n'),
            isActive: game.isActive,
          });
        }
        setStatus('success');
      } catch (err) {
        if (!ignore) { setLoadError(err); setStatus('error'); }
      }
    }
    load();
    return () => { ignore = true; };
  }, [id, isEdit, token, reloadKey]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  function toggleGenre(genreId) {
    setForm({
      ...form,
      genreIds: form.genreIds.includes(genreId) ? form.genreIds.filter((x) => x !== genreId) : [...form.genreIds, genreId],
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      const payload = toPayload(form, isEdit);
      if (isEdit) await updateGame(id, payload, token);
      else await createGame(payload, token);
      navigate('/admin/games');
    } catch (err) {
      setSaveError(err.message);
      setSaving(false);
    }
  }

  if (status === 'loading') return <Loading />;
  if (status === 'error') return <ErrorBox error={loadError} onRetry={() => setReloadKey((k) => k + 1)} />;

  const field = (key, label, input) => (
    <div>
      <label htmlFor={key} className="block text-sm text-sian-muted">{label}</label>
      {input}
      {errors[key] && <p className="mt-1 text-sm text-red-300">{errors[key]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-2xl space-y-4 rounded bg-sian-panel p-5">
      <h2 className="text-lg font-semibold text-white">{isEdit ? 'แก้ไขเกม' : 'เพิ่มเกมใหม่'}</h2>
      {field('title', 'ชื่อเกม', <input id="title" value={form.title} onChange={set('title')} className={inputClass + ' mt-1'} />)}
      {field('description', 'คำอธิบาย', <textarea id="description" rows={3} value={form.description} onChange={set('description')} className={inputClass + ' mt-1'} />)}
      {field('developer', 'ผู้พัฒนา', <input id="developer" value={form.developer} onChange={set('developer')} className={inputClass + ' mt-1'} />)}
      <div className="grid gap-4 sm:grid-cols-2">
        {field('price', 'ราคา (บาท)', <input id="price" type="number" min="1" step="any" value={form.price} onChange={set('price')} className={inputClass + ' mt-1'} />)}
        {field('releaseDate', 'วันวางจำหน่าย', <input id="releaseDate" type="date" value={form.releaseDate} onChange={set('releaseDate')} className={inputClass + ' mt-1'} />)}
      </div>
      {field('cover', 'ลิงก์รูปหลัก', <input id="cover" value={form.cover} onChange={set('cover')} className={inputClass + ' mt-1'} />)}
      <fieldset>
        <legend className="text-sm text-sian-muted">แนวเกม</legend>
        <div className="mt-1 flex flex-wrap gap-3">
          {genres.map((g) => (
            <label key={g.id} className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" checked={form.genreIds.includes(g.id)} onChange={() => toggleGenre(g.id)} />
              {g.name}
            </label>
          ))}
        </div>
        {errors.genreIds && <p className="mt-1 text-sm text-red-300">{errors.genreIds}</p>}
      </fieldset>
      {field('screenshots', 'ลิงก์ภาพตัวอย่าง (บรรทัดละ 1 ลิงก์)', <textarea id="screenshots" rows={4} value={form.screenshots} onChange={set('screenshots')} className={inputClass + ' mt-1'} />)}
      {isEdit && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          ขายอยู่ในร้าน
        </label>
      )}
      {saveError && <p role="alert" className="text-sm text-red-300">{saveError}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className={btnPrimary}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
        <Link to="/admin/games" className={btnGhost}>ยกเลิก</Link>
      </div>
    </form>
  );
}

export default AdminGameForm;
