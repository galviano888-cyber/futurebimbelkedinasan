/*
  # Create tryout_results table

  ## Summary
  Creates the main data table for storing SKD (Seleksi Kompetensi Dasar) tryout results
  for the FBK LMS Dashboard.

  ## New Tables
  - `tryout_results`
    - `id` (uuid, primary key) - unique record identifier
    - `date` (date, not null) - date of the tryout session
    - `package_name` (text, not null) - name of the tryout package
    - `twk` (integer, not null) - TWK (Tes Wawasan Kebangsaan) score
    - `tiu` (integer, not null) - TIU (Tes Intelegensia Umum) score
    - `tkp` (integer, not null) - TKP (Tes Karakteristik Pribadi) score
    - `total` (integer, generated) - computed total (twk + tiu + tkp)
    - `user_id` (uuid, references auth.users) - owner of the record
    - `created_at` (timestamptz) - record creation timestamp

  ## Security
  - RLS enabled on `tryout_results`
  - SELECT: authenticated users can only read their own records
  - INSERT: authenticated users can only insert records for themselves
  - UPDATE: authenticated users can only update their own records
  - DELETE: authenticated users can only delete their own records
*/

CREATE TABLE IF NOT EXISTS tryout_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  package_name text NOT NULL,
  twk integer NOT NULL DEFAULT 0,
  tiu integer NOT NULL DEFAULT 0,
  tkp integer NOT NULL DEFAULT 0,
  total integer GENERATED ALWAYS AS (twk + tiu + tkp) STORED,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tryout_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tryout results"
  ON tryout_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tryout results"
  ON tryout_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tryout results"
  ON tryout_results FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tryout results"
  ON tryout_results FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS tryout_results_user_id_idx ON tryout_results(user_id);
CREATE INDEX IF NOT EXISTS tryout_results_date_idx ON tryout_results(date);
