-- Temuan audit keamanan:
--
--  1. Bucket `payment-proofs` bersifat PUBLIK. File bukti transfer siswa
--     (nama file memuat nomor invoice, isinya screenshot mutasi rekening)
--     dapat diunduh siapa pun tanpa login. Bucket ini sudah tidak dipakai
--     kode aplikasi — alur pembayaran sekarang lewat WhatsApp.
--     Tidak ada transaksi yang masih menyimpan payment_proof_url.
--
--  2. Tabel `analytics_events` menerima INSERT tanpa batas dari anonim.
--     Satu skrip dapat menyuntik ribuan baris dan menghabiskan kuota
--     penyimpanan. Dibatasi per sesi.

begin;

-- ── 1. Tutup akses publik ke bukti transfer ────────────────────────────────
-- Bucket dijadikan privat: objek tetap ada (tidak dihapus, untuk jejak audit)
-- tetapi tidak bisa diakses tanpa kredensial. Hanya admin yang boleh membaca.
update storage.buckets
set public = false
where id in ('payment-proofs');

-- Bersihkan policy lama yang mungkin membuka akses baca.
drop policy if exists "payment proofs public read" on storage.objects;
drop policy if exists "Public read payment proofs" on storage.objects;
drop policy if exists "payment_proofs_public_read" on storage.objects;

-- Admin saja yang boleh membaca isi bucket ini.
drop policy if exists "payment_proofs_admin_read" on storage.objects;
create policy "payment_proofs_admin_read"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'payment-proofs'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
    )
  );

-- ── 2. Batasi laju pencatatan analytics ────────────────────────────────────
-- Menahan penggembungan penyimpanan dari penyuntikan massal. Bukan pertahanan
-- sempurna terhadap penyerang yang membuat ID sesi acak, tetapi cukup untuk
-- mencegah satu skrip mengirim puluhan ribu baris sekaligus.
create or replace function public.limit_analytics_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recent integer;
begin
  if new.session_id is not null then
    select count(*) into v_recent
    from public.analytics_events e
    where e.session_id = new.session_id
      and e.created_at > now() - interval '1 hour';

    if v_recent >= 200 then
      -- Diamkan saja: pencatatan statistik tidak boleh menggagalkan UI siswa.
      return null;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.limit_analytics_events() from public, anon, authenticated;

drop trigger if exists trg_limit_analytics_events on public.analytics_events;
create trigger trg_limit_analytics_events
  before insert on public.analytics_events
  for each row
  execute function public.limit_analytics_events();

notify pgrst, 'reload schema';

commit;
