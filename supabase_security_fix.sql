CREATE OR REPLACE FUNCTION calculate_tryout_results_secure()
RETURNS TRIGGER AS $$
DECLARE
    ans_item RECORD;
    q_data RECORD;
    res_twk INTEGER := 0;
    res_tiu INTEGER := 0;
    res_tkp INTEGER := 0;
BEGIN
    FOR ans_item IN SELECT * FROM jsonb_each_text(NEW.answers) LOOP
        SELECT category, correct_answer, tkp_scores 
        INTO q_data
        FROM tryout_questions 
        WHERE id = ans_item.key::UUID;

        IF q_data.category IS NOT NULL THEN
            IF q_data.category = 'TWK' AND ans_item.value = q_data.correct_answer THEN
                res_twk := res_twk + 5;
            ELSIF q_data.category = 'TIU' AND ans_item.value = q_data.correct_answer THEN
                res_tiu := res_tiu + 5;
            ELSIF q_data.category = 'TKP' THEN
                IF q_data.tkp_scores IS NOT NULL THEN
                    res_tkp := res_tkp + COALESCE((q_data.tkp_scores->>ans_item.value)::INTEGER, 0);
                ELSIF ans_item.value = q_data.correct_answer THEN
                    res_tkp := res_tkp + 5;
                END IF;
            END IF;
        END IF;
    END LOOP;

    NEW.twk := res_twk;
    NEW.tiu := res_tiu;
    NEW.tkp := res_tkp;
    NEW.total := res_twk + res_tiu + res_tkp;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_tryout_results ON tryout_results;
CREATE TRIGGER trg_validate_tryout_results
    BEFORE INSERT ON tryout_results
    FOR EACH ROW
    EXECUTE FUNCTION calculate_tryout_results_secure();
