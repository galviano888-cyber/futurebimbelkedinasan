-- Restore data paket yang hilang akibat cascade delete.
-- Sumber: backups/2026-11-14T16-37-45
-- Trigger kuota & penjualan dimatikan sementara agar data lama
-- tidak memicu penjualan baru atau tertolak kuota.

begin;

alter table public.user_packages disable trigger trg_close_fulfilled_requests;
alter table public.user_packages disable trigger trg_enforce_package_quota;

-- packages (2)
insert into public.packages (id, title, description, price, is_active, created_at, product_type, guide_url, guide_text, original_price, cover_image_url, category, image_url, quota, seats_taken)
values ('ecb57852-7955-49d8-a237-66bd8b95015e', 'AKSELERASI SKD KEDINASAN BATCH 1', '15x Live Class Zoom, Bonus 1x Pertemuan (Sharing Session Kedinasan), Free 3x Tryout, Grup Diskusi Belajar dengan Mentor, Kelas Dimulai Tanggal 6 Juli 2026', 99999, true, '2026-06-21T06:09:17.823236+00:00', 'INTENSIF', 'https://t.me/+x2KUZPbqaDE4NDY1', 'Masuk Grup Telegram Batch 1', 250000, 'https://lglqbxaoxkdsfrqvuplq.supabase.co/storage/v1/object/public/media/package-covers/1782225562702-5j8z3ip2p8r.png', null, null, null, 2)
on conflict (id) do nothing;
insert into public.packages (id, title, description, price, is_active, created_at, product_type, guide_url, guide_text, original_price, cover_image_url, category, image_url, quota, seats_taken)
values ('1171baaf-5d08-4755-8677-9966626320a9', 'SKD STARTER PACK', 'Free 1x tes SKD, Bonus Pembahasan Soal, Fitur Anti-Cheat Tryout, Ranking Nasional SKD', 0, true, '2026-04-19T03:39:09.768096+00:00', 'BUNDLE', '', 'Masuk grup dan baca langkah-langkah panduan Bimbel', 10000, 'https://lglqbxaoxkdsfrqvuplq.supabase.co/storage/v1/object/public/media/package-covers/1782225728549-63tkrkf2014.png', null, null, null, 27)
on conflict (id) do nothing;

-- package_contents (20)
insert into public.package_contents (id, package_id, type, title, url, order_index, created_at, tryout_id, is_bonus, zoom_link, recording_url, content_date, schedule_date, mentor_name, schedule_text, live_schedule)
values ('f522e72f-33d1-4b4c-8041-a8ff06dadf48', 'ecb57852-7955-49d8-a237-66bd8b95015e', 'tryout', 'Tryout SKD B1 - 03', null, 2, '2026-07-10T13:30:59.502314+00:00', null, false, null, null, null, null, null, null, null)
on conflict (id) do nothing;
insert into public.package_contents (id, package_id, type, title, url, order_index, created_at, tryout_id, is_bonus, zoom_link, recording_url, content_date, schedule_date, mentor_name, schedule_text, live_schedule)
values ('939ffcaf-054f-48d1-bf2d-0e203b14497f', 'ecb57852-7955-49d8-a237-66bd8b95015e', 'tryout', 'Tryout SKD B1 - 02', null, 1, '2026-07-10T13:30:59.502314+00:00', null, false, null, null, null, null, null, null, null)
on conflict (id) do nothing;
insert into public.package_contents (id, package_id, type, title, url, order_index, created_at, tryout_id, is_bonus, zoom_link, recording_url, content_date, schedule_date, mentor_name, schedule_text, live_schedule)
values ('3f44fb6c-18be-4703-9803-c17cd20eba5e', 'ecb57852-7955-49d8-a237-66bd8b95015e', 'tryout', 'Tryout SKD B1 - 01', null, 0, '2026-07-10T13:30:59.502314+00:00', null, false, null, null, null, null, null, null, null)
on conflict (id) do nothing;
insert into public.package_contents (id, package_id, type, title, url, order_index, created_at, tryout_id, is_bonus, zoom_link, recording_url, content_date, schedule_date, mentor_name, schedule_text, live_schedule)
values ('425e06e0-76f8-47a3-9ace-861da6cacbe4', 'ecb57852-7955-49d8-a237-66bd8b95015e', 'video', 'P1 - TWK Nasionalisme', null, 3, '2026-07-10T13:30:59.502314+00:00', null, false, null, null, null, '6/7/2026 (19.45 WIB)', 'Syauqi', null, null)
on conflict (id) do nothing;
insert into public.package_contents (id, package_id, type, title, url, order_index, created_at, tryout_id, is_bonus, zoom_link, recording_url, content_date, schedule_date, mentor_name, schedule_text, live_schedule)
values ('860564e1-1d03-498b-8e4c-735b94725e95', 'ecb57852-7955-49d8-a237-66bd8b95015e', 'video', 'P2 -TIU Verbal', null, 4, '2026-07-10T13:30:59.502314+00:00', null, false, null, null, null, '7/7/2026 (19.45 WIB)', 'Indra', null, null)
on conflict (id) do nothing;
insert into public.package_contents (id, package_id, type, title, url, order_index, created_at, tryout_id, is_bonus, zoom_link, recording_url, content_date, schedule_date, mentor_name, schedule_text, live_schedule)
values ('42617d3c-9413-46bb-a297-82620d3005ef', 'ecb57852-7955-49d8-a237-66bd8b95015e', 'video', 'P3 - TKP Sosial Budaya', null, 5, '2026-07-10T13:30:59.502314+00:00', null, false, null, null, null, '8/7/2026 (19.45 WIB)', 'Taviano', null, null)
on conflict (id) do nothing;
insert into public.package_contents (id, package_id, type, title, url, order_index, created_at, tryout_id, is_bonus, zoom_link, recording_url, content_date, schedule_date, mentor_name, schedule_text, live_schedule)
values ('2c4927bf-e99a-4996-93c6-06761be277d1', 'ecb57852-7955-49d8-a237-66bd8b95015e', 'video', 'P4 - TWK Sistem Pemerintahan', null, 6, '2026-07-10T13:30:59.502314+00:00', null, false, null, null, null, '9/7/2026 (19.45 WIB)', 'Syauqi', null, null)
on conflict (id) do nothing;
insert into public.package_contents (id, package_id, type, title, url, order_index, created_at, tryout_id, is_bonus, zoom_link, recording_url, content_date, schedule_date, mentor_name, schedule_text, live_schedule)
values ('f21bcdec-8ad6-4607-b653-c4cde5b56b38', 'ecb57852-7955-49d8-a237-66bd8b95015e', 'video', 'P5 - TIU Numerik Dasar', null, 7, '2026-07-10T13:30:59.502314+00:00', null, false, null, null, null, '10/7/2026 (19.45 WIB)', 'Indra', null, null)
on conflict (id) do nothing;
insert into public.package_contents (id, package_id, type, title, url, order_index, created_at, tryout_id, is_bonus, zoom_link, recording_url, content_date, schedule_date, mentor_name, schedule_text, live_schedule)
values ('b5e6523d-3115-46e0-98c7-df8702824848', 'ecb57852-7955-49d8-a237-66bd8b95015e', 'video', 'P6 - TKP Teknologi, Informasi dan Komunikasi', null, 8, '2026-07-10T13:30:59.502314+00:00', null, false, null, null, null, '12/7/2026 (19.45 WIB)', 'Taviano', null, null)
on conflict (id) do nothing;
insert into public.package_contents (id, package_id, type, title, url, order_index, created_at, tryout_id, is_bonus, zoom_link, recording_url, content_date, schedule_date, mentor_name, schedule_text, live_schedule)
values ('4dd06521-ce56-437d-9a44-86253e6afeaa', 'ecb57852-7955-49d8-a237-66bd8b95015e', 'video', 'P7 - TWK Bela Negara', null, 9, '2026-07-10T13:30:59.502314+00:00', null, false, null, null, null, '13/7/2026 (19.45 WIB)', 'Syauqi', null, null)
on conflict (id) do nothing;
insert into public.package_contents (id, package_id, type, title, url, order_index, created_at, tryout_id, is_bonus, zoom_link, recording_url, content_date, schedule_date, mentor_name, schedule_text, live_schedule)
values ('fb07b95d-8001-4ded-a6ef-9698485e86a8', 'ecb57852-7955-49d8-a237-66bd8b95015e', 'video', 'P8 - TIU Numerik Lanjut', null, 10, '2026-07-10T13:30:59.502314+00:00', null, false, null, null, null, '14/7/2026 (19.45 WIB)', 'Indra', null, null)
on conflict (id) do nothing;
insert into public.package_contents (id, package_id, type, title, url, order_index, created_at, tryout_id, is_bonus, zoom_link, recording_url, content_date, schedule_date, mentor_name, schedule_text, live_schedule)
values ('8ac4c86e-285d-434b-95ce-61d9fbf84c23', 'ecb57852-7955-49d8-a237-66bd8b95015e', 'video', 'P9 - TWK Anti Radikalisme', null, 11, '2026-07-10T13:30:59.502314+00:00', null, false, null, null, null, '15/7/2026 (19.45 WIB)', 'Taviano', null, null)
on conflict (id) do nothing;
insert into public.package_contents (id, package_id, type, title, url, order_index, created_at, tryout_id, is_bonus, zoom_link, recording_url, content_date, schedule_date, mentor_name, schedule_text, live_schedule)
values ('4bdeaeae-a152-4b3c-b786-d2bcdd4a7b6c', 'ecb57852-7955-49d8-a237-66bd8b95015e', 'video', 'P10 - TWK Pilar Negara', null, 12, '2026-07-10T13:30:59.502314+00:00', null, false, null, null, null, '16/7/2026 (19.45 WIB)', 'Syauqi', null, null)
on conflict (id) do nothing;
insert into public.package_contents (id, package_id, type, title, url, order_index, created_at, tryout_id, is_bonus, zoom_link, recording_url, content_date, schedule_date, mentor_name, schedule_text, live_schedule)
values ('246f90f6-1010-4aff-baef-a88bd74e2cc0', 'ecb57852-7955-49d8-a237-66bd8b95015e', 'video', 'P11 - TIU Penalaran Logis', null, 13, '2026-07-10T13:30:59.502314+00:00', null, false, null, null, null, '17/7/2026 (19.45 WIB)', 'Indra', null, null)
on conflict (id) do nothing;
insert into public.package_contents (id, package_id, type, title, url, order_index, created_at, tryout_id, is_bonus, zoom_link, recording_url, content_date, schedule_date, mentor_name, schedule_text, live_schedule)
values ('db51bcda-964a-48f2-96be-de561fe2911c', 'ecb57852-7955-49d8-a237-66bd8b95015e', 'video', 'P12 - TKP Pelayanan Publik, Profesionalisme, Jejaring Kerja', null, 14, '2026-07-10T13:30:59.502314+00:00', null, false, null, null, null, '19/7/2026 (19.45 WIB)', 'Galih', null, null)
on conflict (id) do nothing;
insert into public.package_contents (id, package_id, type, title, url, order_index, created_at, tryout_id, is_bonus, zoom_link, recording_url, content_date, schedule_date, mentor_name, schedule_text, live_schedule)
values ('7f663634-601f-4a29-81fe-6881556dbe3b', 'ecb57852-7955-49d8-a237-66bd8b95015e', 'video', 'P13 - TWK Bahasa Indonesia', null, 15, '2026-07-10T13:30:59.502314+00:00', null, false, null, null, null, '20/7/2026 (19.45 WIB)', 'Syauqi', null, null)
on conflict (id) do nothing;
insert into public.package_contents (id, package_id, type, title, url, order_index, created_at, tryout_id, is_bonus, zoom_link, recording_url, content_date, schedule_date, mentor_name, schedule_text, live_schedule)
values ('351558df-08d5-41b6-a6ba-c68f763533af', 'ecb57852-7955-49d8-a237-66bd8b95015e', 'video', 'P14 - TIU Figural', null, 16, '2026-07-10T13:30:59.502314+00:00', null, false, null, null, null, '21/7/2026 (19.45 WIB)', 'Indra', null, null)
on conflict (id) do nothing;
insert into public.package_contents (id, package_id, type, title, url, order_index, created_at, tryout_id, is_bonus, zoom_link, recording_url, content_date, schedule_date, mentor_name, schedule_text, live_schedule)
values ('95ad3c8d-5acd-4a2c-9d16-47fb266f140e', 'ecb57852-7955-49d8-a237-66bd8b95015e', 'video', 'P15 - TKP Pendalaman Materi', null, 17, '2026-07-10T13:30:59.502314+00:00', null, false, null, null, null, '22/7/2026 (19.45 WIB)', 'Galih', null, null)
on conflict (id) do nothing;
insert into public.package_contents (id, package_id, type, title, url, order_index, created_at, tryout_id, is_bonus, zoom_link, recording_url, content_date, schedule_date, mentor_name, schedule_text, live_schedule)
values ('73bb7b73-a58d-4739-9f7d-e6a3630fcb33', 'ecb57852-7955-49d8-a237-66bd8b95015e', 'video', 'P16 - Sharing Session Kedinasan', null, 18, '2026-07-10T13:30:59.502314+00:00', null, false, null, null, null, '24/7/2026 (19.45 WIB)', null, null, null)
on conflict (id) do nothing;
insert into public.package_contents (id, package_id, type, title, url, order_index, created_at, tryout_id, is_bonus, zoom_link, recording_url, content_date, schedule_date, mentor_name, schedule_text, live_schedule)
values ('81272cce-4ad5-4e4a-8383-872cf8649ea1', '1171baaf-5d08-4755-8677-9966626320a9', 'tryout', 'SKD Pretest', null, 0, '2026-06-25T08:39:29.448278+00:00', null, false, null, null, null, null, null, null, null)
on conflict (id) do nothing;

-- user_packages (29)
insert into public.user_packages (id, user_id, package_id, transaction_id, activated_at)
values ('b14627c9-0a6f-4ffd-880c-8db79882c2b6', '6970917d-f6e2-4d71-954f-45da23ec968f', '1171baaf-5d08-4755-8677-9966626320a9', null, '2026-04-19T09:42:19.521054+00:00')
on conflict (id) do nothing;
insert into public.user_packages (id, user_id, package_id, transaction_id, activated_at)
values ('3ac33d5a-e6ac-4d67-855c-d32e0a669a00', 'ba058d83-15d3-4139-914f-50ee8bdd62af', '1171baaf-5d08-4755-8677-9966626320a9', null, '2026-06-18T13:32:29.18048+00:00')
on conflict (id) do nothing;
insert into public.user_packages (id, user_id, package_id, transaction_id, activated_at)
values ('68556558-efb3-4d6b-86aa-a4dbe242f3b7', '722efd11-aeee-4581-94a7-5051730b4545', '1171baaf-5d08-4755-8677-9966626320a9', null, '2026-06-19T05:34:11.480642+00:00')
on conflict (id) do nothing;
insert into public.user_packages (id, user_id, package_id, transaction_id, activated_at)
values ('775c7c4a-a3d7-4853-be47-fe4b2f9a33c3', 'cd1cba1c-5e83-47e9-b1d0-b746d2925332', '1171baaf-5d08-4755-8677-9966626320a9', null, '2026-06-21T02:27:39.530017+00:00')
on conflict (id) do nothing;
insert into public.user_packages (id, user_id, package_id, transaction_id, activated_at)
values ('2e1e027e-2122-4a15-95b3-32b2f7010ea2', 'be9cc012-5c50-4993-b63a-e4bb854b8766', '1171baaf-5d08-4755-8677-9966626320a9', null, '2026-06-21T06:21:28.680224+00:00')
on conflict (id) do nothing;
insert into public.user_packages (id, user_id, package_id, transaction_id, activated_at)
values ('d860543d-66ad-4bc2-b92c-e56471e51bb1', '6e9801f0-2339-4a19-a236-052b2b4dde0d', '1171baaf-5d08-4755-8677-9966626320a9', null, '2026-06-21T22:26:28.980749+00:00')
on conflict (id) do nothing;
insert into public.user_packages (id, user_id, package_id, transaction_id, activated_at)
values ('f4f90156-2e93-44c4-b7b8-7c267194047a', '866bbc21-7737-4598-ae14-4500edc77b9b', '1171baaf-5d08-4755-8677-9966626320a9', null, '2026-06-22T13:45:34.730107+00:00')
on conflict (id) do nothing;
insert into public.user_packages (id, user_id, package_id, transaction_id, activated_at)
values ('c5623fbd-ca73-4c68-b2fe-13c303b49567', '19ff8045-2ab6-465c-87db-b9e90b9bc900', '1171baaf-5d08-4755-8677-9966626320a9', null, '2026-06-24T12:30:47.106623+00:00')
on conflict (id) do nothing;
insert into public.user_packages (id, user_id, package_id, transaction_id, activated_at)
values ('2663be56-d68c-4f7b-a1ce-a4858e1b12db', '19ff8045-2ab6-465c-87db-b9e90b9bc900', 'ecb57852-7955-49d8-a237-66bd8b95015e', null, '2026-06-24T12:32:50.490144+00:00')
on conflict (id) do nothing;
insert into public.user_packages (id, user_id, package_id, transaction_id, activated_at)
values ('4cba9a45-8120-4f81-b5c3-717183d96666', '2c7052ed-b484-460b-bbc1-100820a2ec82', 'ecb57852-7955-49d8-a237-66bd8b95015e', '9e7f97d5-27e0-436c-b648-195ee058fa6f', '2026-06-24T12:43:33.62798+00:00')
on conflict (id) do nothing;
insert into public.user_packages (id, user_id, package_id, transaction_id, activated_at)
values ('c9c3c25a-03f9-42d6-be24-2ea72f5ccdd9', '2c7052ed-b484-460b-bbc1-100820a2ec82', '1171baaf-5d08-4755-8677-9966626320a9', null, '2026-06-24T13:12:11.062965+00:00')
on conflict (id) do nothing;
insert into public.user_packages (id, user_id, package_id, transaction_id, activated_at)
values ('2802cfe5-b35b-457a-ac37-abfe0243eaa4', 'cbdfc228-916f-41d6-8a8a-899578b0aa8e', '1171baaf-5d08-4755-8677-9966626320a9', null, '2026-06-26T11:46:24.9781+00:00')
on conflict (id) do nothing;
insert into public.user_packages (id, user_id, package_id, transaction_id, activated_at)
values ('dd426016-1954-4636-8e1b-5cd70e80689a', '15af7b7c-a775-4c4e-8448-d57000fd2f1e', '1171baaf-5d08-4755-8677-9966626320a9', null, '2026-06-26T16:26:17.862106+00:00')
on conflict (id) do nothing;
insert into public.user_packages (id, user_id, package_id, transaction_id, activated_at)
values ('b129d748-1350-4c40-bf07-a0298a593164', 'fbff9d9a-da0a-436a-bb4e-d720cf2b3eff', '1171baaf-5d08-4755-8677-9966626320a9', null, '2026-06-29T12:54:14.733204+00:00')
on conflict (id) do nothing;
insert into public.user_packages (id, user_id, package_id, transaction_id, activated_at)
values ('12686879-8ff9-46c4-bb02-5f5bfc8ff386', 'fac4b922-5362-4e4c-a06c-ca0c5867ca50', '1171baaf-5d08-4755-8677-9966626320a9', null, '2026-06-29T13:08:59.799421+00:00')
on conflict (id) do nothing;
insert into public.user_packages (id, user_id, package_id, transaction_id, activated_at)
values ('268466fb-0a33-4134-bc1d-a718d656beee', '9d083281-d0b7-4711-8684-768c13485a29', '1171baaf-5d08-4755-8677-9966626320a9', null, '2026-07-01T10:44:47.571545+00:00')
on conflict (id) do nothing;
insert into public.user_packages (id, user_id, package_id, transaction_id, activated_at)
values ('869bcdd1-8789-487b-8826-ea46dda09869', '64743e31-f247-4d3f-9bab-433fd7fce11f', '1171baaf-5d08-4755-8677-9966626320a9', null, '2026-07-02T07:20:10.487237+00:00')
on conflict (id) do nothing;
insert into public.user_packages (id, user_id, package_id, transaction_id, activated_at)
values ('c1e45322-6571-441c-ab1a-fb9c7f14fa33', '99059035-3f06-433f-9f80-84ae64aff7cf', '1171baaf-5d08-4755-8677-9966626320a9', null, '2026-07-07T13:20:42.947899+00:00')
on conflict (id) do nothing;
insert into public.user_packages (id, user_id, package_id, transaction_id, activated_at)
values ('2c04b1fb-a46a-4313-b40b-656f4313bd43', '126500d1-b8ff-45a9-b8ec-071c671047e8', '1171baaf-5d08-4755-8677-9966626320a9', null, '2026-07-13T03:36:58.562503+00:00')
on conflict (id) do nothing;
insert into public.user_packages (id, user_id, package_id, transaction_id, activated_at)
values ('f9630f2a-c0d3-4672-827b-cd144915eebd', '720115c4-6952-44d8-af62-b37573b8168c', '1171baaf-5d08-4755-8677-9966626320a9', null, '2026-07-19T19:18:54.57793+00:00')
on conflict (id) do nothing;
insert into public.user_packages (id, user_id, package_id, transaction_id, activated_at)
values ('49400af0-abb9-4420-a298-4178131307eb', '63035c8c-c36c-407a-b1c7-fbb429577a5b', '1171baaf-5d08-4755-8677-9966626320a9', null, '2026-07-21T00:39:40.753979+00:00')
on conflict (id) do nothing;
insert into public.user_packages (id, user_id, package_id, transaction_id, activated_at)
values ('83dcc45d-7f7e-4fa2-95a1-a18cd27df6b0', '3066f1e8-7296-4eea-bc88-cb5292ece6e7', '1171baaf-5d08-4755-8677-9966626320a9', null, '2026-07-21T03:02:57.473412+00:00')
on conflict (id) do nothing;
insert into public.user_packages (id, user_id, package_id, transaction_id, activated_at)
values ('d3ba868a-24c3-4735-b56a-64174b4890ef', '8ce77aa5-3232-4e2d-aa8d-ce584f317f42', '1171baaf-5d08-4755-8677-9966626320a9', null, '2026-07-23T01:00:59.250057+00:00')
on conflict (id) do nothing;
insert into public.user_packages (id, user_id, package_id, transaction_id, activated_at)
values ('47337ce3-b7c3-428b-adb6-1406778c4033', '65e166c5-d7a7-4f49-874c-ba33283051b4', '1171baaf-5d08-4755-8677-9966626320a9', null, '2026-07-23T12:52:50.152333+00:00')
on conflict (id) do nothing;
insert into public.user_packages (id, user_id, package_id, transaction_id, activated_at)
values ('ee172f7c-b0b8-4999-9d67-9fdb75ebf794', 'e1a7fb1c-83d5-4d56-b4e4-74c9d5854536', '1171baaf-5d08-4755-8677-9966626320a9', null, '2026-07-25T03:48:22.382406+00:00')
on conflict (id) do nothing;
insert into public.user_packages (id, user_id, package_id, transaction_id, activated_at)
values ('b82b9df7-4e9e-4e4e-8f3f-021b264131af', 'b5978919-1fc0-4044-ac56-ab429b077134', '1171baaf-5d08-4755-8677-9966626320a9', null, '2026-06-13T08:36:39.332181+00:00')
on conflict (id) do nothing;
insert into public.user_packages (id, user_id, package_id, transaction_id, activated_at)
values ('1a2808fd-ab1c-4d63-aeb0-2c9e22715392', '92acb6c7-a51f-4dcb-bd00-a55b4149708d', '1171baaf-5d08-4755-8677-9966626320a9', null, '2026-06-14T10:25:13.548889+00:00')
on conflict (id) do nothing;
insert into public.user_packages (id, user_id, package_id, transaction_id, activated_at)
values ('2094ca5d-698c-41c7-9f06-0df54bc9d59a', 'e0ff69bb-68b3-44c3-b3dc-6b668d674f9b', '1171baaf-5d08-4755-8677-9966626320a9', null, '2026-06-16T12:30:30.748489+00:00')
on conflict (id) do nothing;
insert into public.user_packages (id, user_id, package_id, transaction_id, activated_at)
values ('e7dfd8f9-59ba-435f-b185-35b7d3d7dcc6', 'f5654a84-9673-4177-ade9-d4947567801e', '1171baaf-5d08-4755-8677-9966626320a9', null, '2026-06-16T13:56:31.362529+00:00')
on conflict (id) do nothing;

alter table public.user_packages enable trigger trg_close_fulfilled_requests;
alter table public.user_packages enable trigger trg_enforce_package_quota;

-- seats_taken disamakan dengan jumlah akses sebenarnya.
update public.packages p
set seats_taken = coalesce(sub.cnt, 0)
from (
  select package_id, count(*)::int as cnt
  from public.user_packages group by package_id
) sub
where p.id = sub.package_id;

-- Hapus paket uji audit yang tersisa.
delete from public.package_contents where package_id = '9249474f-ef35-4d63-a5b7-5f5da79a7e03';
delete from public.user_packages where package_id = '9249474f-ef35-4d63-a5b7-5f5da79a7e03';
delete from public.transactions where package_id = '9249474f-ef35-4d63-a5b7-5f5da79a7e03';
delete from public.packages where id = '9249474f-ef35-4d63-a5b7-5f5da79a7e03';

notify pgrst, 'reload schema';

commit;
