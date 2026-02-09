-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('TEXT_ONLY', 'TEXT_TO_IMAGE', 'IMAGE_TO_TEXT', 'AUDIO_TO_IMAGE', 'AUDIO_TO_TEXT', 'FILL_BLANK', 'MATCHING', 'COLOR_DESCRIPTION', 'ALPHABET', 'GENDER_SELECTION', 'CONJUGATION', 'DRAG_DROP', 'FREE_WRITING');

-- CreateEnum
CREATE TYPE "SkillCategory" AS ENUM ('LISTENING', 'SPEAKING', 'READING', 'WRITING', 'GRAMMAR', 'VOCABULARY', 'ALPHABET');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL_MAGIC_LINK', 'GOOGLE', 'APPLE', 'RESERVATION_CODE');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('GUEST', 'HOST', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('MINIBAR', 'BREAKFAST', 'EXPERIENCE', 'TRANSPORT', 'CLEANING', 'OTHER');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'CONFIRMED', 'DELIVERED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "TransportType" AS ENUM ('METRO', 'BUS', 'TRAIN', 'TAXI_STAND', 'AIRPORT', 'SUPERMARKET', 'PHARMACY', 'RESTAURANT', 'ATTRACTION', 'PARKING');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "website" TEXT,
    "subscription_tier" TEXT NOT NULL DEFAULT 'free',
    "subscription_status" TEXT NOT NULL DEFAULT 'active',
    "trial_ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'staff',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'fr',
    "authProvider" "AuthProvider" NOT NULL,
    "passwordHash" TEXT,
    "refreshToken" TEXT,
    "legalAcceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "guest_id" TEXT NOT NULL,
    "confirmation_code" TEXT NOT NULL,
    "check_in" TIMESTAMP(3) NOT NULL,
    "check_out" TIMESTAMP(3) NOT NULL,
    "room_number" TEXT,
    "room_type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "total_amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "guest_id" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'web',
    "language" TEXT NOT NULL DEFAULT 'fr',
    "status" TEXT NOT NULL DEFAULT 'active',
    "assigned_to" TEXT,
    "soncas_profile" TEXT,
    "emotional_state" TEXT,
    "needs_intervention" BOOLEAN NOT NULL DEFAULT false,
    "intervention_reason" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "llm_model" TEXT,
    "tokens_used" INTEGER,
    "processing_time_ms" INTEGER,
    "objection_detected" BOOLEAN NOT NULL DEFAULT false,
    "objection_type" TEXT,
    "objection_confidence" DOUBLE PRECISION,
    "sentiment" TEXT,
    "sentiment_score" DOUBLE PRECISION,
    "emotions_detected" JSONB,
    "soncas_indicators" JSONB,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "housekeeping_companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "housekeeping_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "housekeeping_company_progressions" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "overall_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "current_level" INTEGER NOT NULL DEFAULT 1,
    "quality_standards_points" INTEGER NOT NULL DEFAULT 0,
    "validated_photos_points" INTEGER NOT NULL DEFAULT 0,
    "satisfaction_points" INTEGER NOT NULL DEFAULT 0,
    "training_points" INTEGER NOT NULL DEFAULT 0,
    "total_quality_checks" INTEGER NOT NULL DEFAULT 0,
    "passed_quality_checks" INTEGER NOT NULL DEFAULT 0,
    "photos_submitted" INTEGER NOT NULL DEFAULT 0,
    "photos_validated" INTEGER NOT NULL DEFAULT 0,
    "avg_satisfaction_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "autonomous_deployment" BOOLEAN NOT NULL DEFAULT false,
    "priority_access" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "housekeeping_company_progressions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "housekeepers" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "registered_phone_id" TEXT,
    "native_language" TEXT NOT NULL,
    "target_language" TEXT NOT NULL DEFAULT 'fr',
    "current_level" TEXT NOT NULL DEFAULT 'A1.1',
    "avatar_id" TEXT,
    "avatar_customization" JSONB,
    "total_xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "badges" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "housekeepers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "language_progress" (
    "id" TEXT NOT NULL,
    "housekeeper_id" TEXT NOT NULL,
    "current_level" TEXT NOT NULL DEFAULT 'A1.1',
    "total_lessons" INTEGER NOT NULL DEFAULT 0,
    "completed_lessons" INTEGER NOT NULL DEFAULT 0,
    "total_quizzes" INTEGER NOT NULL DEFAULT 0,
    "passed_quizzes" INTEGER NOT NULL DEFAULT 0,
    "listening_score" INTEGER NOT NULL DEFAULT 0,
    "speaking_score" INTEGER NOT NULL DEFAULT 0,
    "reading_score" INTEGER NOT NULL DEFAULT 0,
    "writing_score" INTEGER NOT NULL DEFAULT 0,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_activity" TIMESTAMP(3),
    "certified_level" TEXT,
    "certification_date" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "language_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "language_quiz_questions" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "question_text" TEXT NOT NULL,
    "question_audio_url" TEXT,
    "option_a" TEXT NOT NULL,
    "option_b" TEXT NOT NULL,
    "option_c" TEXT NOT NULL,
    "option_d" TEXT NOT NULL,
    "correct_option" TEXT NOT NULL,
    "explanation_text" TEXT NOT NULL,
    "explanation_audio" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "xp_reward" INTEGER NOT NULL DEFAULT 10,
    "tags" TEXT[],
    "times_shown" INTEGER NOT NULL DEFAULT 0,
    "times_correct" INTEGER NOT NULL DEFAULT 0,
    "success_rate" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "validated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "language_quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "language_quiz_responses" (
    "id" TEXT NOT NULL,
    "housekeeper_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "selected_option" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "time_taken_seconds" INTEGER,
    "session_id" TEXT,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "xp_earned" INTEGER NOT NULL DEFAULT 0,
    "badge_unlocked" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "language_quiz_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cleaning_quiz_questions" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "question_text" TEXT NOT NULL,
    "question_image_url" TEXT,
    "option_a" TEXT NOT NULL,
    "option_b" TEXT NOT NULL,
    "option_c" TEXT NOT NULL,
    "option_d" TEXT NOT NULL,
    "correct_option" TEXT NOT NULL,
    "explanation_text" TEXT NOT NULL,
    "explanation_video" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "xp_reward" INTEGER NOT NULL DEFAULT 15,
    "tags" TEXT[],
    "required_for_cert" BOOLEAN NOT NULL DEFAULT false,
    "hotel_standard" TEXT,
    "times_shown" INTEGER NOT NULL DEFAULT 0,
    "times_correct" INTEGER NOT NULL DEFAULT 0,
    "success_rate" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "validated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cleaning_quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cleaning_quiz_responses" (
    "id" TEXT NOT NULL,
    "housekeeper_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "selected_option" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "time_taken_seconds" INTEGER,
    "session_id" TEXT,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "xp_earned" INTEGER NOT NULL DEFAULT 0,
    "badge_unlocked" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cleaning_quiz_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "model_3d_url" TEXT,
    "rarity" TEXT NOT NULL,
    "base_price" INTEGER NOT NULL,
    "current_market_value" INTEGER,
    "available_for_purchase" BOOLEAN NOT NULL DEFAULT true,
    "required_level" INTEGER NOT NULL DEFAULT 1,
    "required_badge" TEXT,
    "limited_edition" BOOLEAN NOT NULL DEFAULT false,
    "max_supply" INTEGER,
    "current_supply" INTEGER,
    "times_purchased" INTEGER NOT NULL DEFAULT 0,
    "times_traded" INTEGER NOT NULL DEFAULT 0,
    "popularity_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "animation_data" JSONB,
    "special_effects" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trades" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "item1_id" TEXT,
    "item1_quantity" INTEGER NOT NULL DEFAULT 1,
    "item2_id" TEXT,
    "item2_quantity" INTEGER NOT NULL DEFAULT 1,
    "xp_from_seller" INTEGER NOT NULL DEFAULT 0,
    "xp_from_buyer" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "offer_message" TEXT,
    "counter_offer" TEXT,
    "completed_at" TIMESTAMP(3),
    "cancelled_reason" TEXT,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "flagged_reason" TEXT,
    "admin_reviewed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_base_entries" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'fr',
    "translations" JSONB,
    "tags" TEXT[],
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "last_used" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_base_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_metrics" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "total_messages" INTEGER NOT NULL DEFAULT 0,
    "avg_response_time_ms" INTEGER NOT NULL DEFAULT 0,
    "resolution_time_ms" INTEGER,
    "objections_detected" INTEGER NOT NULL DEFAULT 0,
    "objections_resolved" INTEGER NOT NULL DEFAULT 0,
    "sentiment_changes" INTEGER NOT NULL DEFAULT 0,
    "resolved_by_ai" BOOLEAN NOT NULL DEFAULT false,
    "escalated_to_human" BOOLEAN NOT NULL DEFAULT false,
    "guest_satisfaction" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quest_worlds" (
    "id" TEXT NOT NULL,
    "world_number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "name_short" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "narrative_intro" TEXT NOT NULL,
    "narrative_outro" TEXT NOT NULL,
    "theme_color" TEXT NOT NULL,
    "background_image" TEXT,
    "ambient_music_url" TEXT,
    "icon_emoji" TEXT NOT NULL DEFAULT '🌍',
    "min_level" TEXT NOT NULL,
    "max_level" TEXT NOT NULL,
    "required_world" INTEGER,
    "required_quests" INTEGER NOT NULL DEFAULT 0,
    "total_quests" INTEGER NOT NULL DEFAULT 0,
    "has_boss" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quest_worlds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quests" (
    "id" TEXT NOT NULL,
    "world_id" TEXT NOT NULL,
    "quest_number" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "narrative_text" TEXT NOT NULL,
    "objectives" JSONB NOT NULL,
    "min_level_cecrl" TEXT NOT NULL,
    "required_quests" TEXT[],
    "xp_base" INTEGER NOT NULL DEFAULT 100,
    "xp_bonus" INTEGER NOT NULL DEFAULT 0,
    "badge_reward" TEXT,
    "item_rewards" TEXT[],
    "quest_icon" TEXT NOT NULL DEFAULT '📜',
    "cover_image" TEXT,
    "intro_cutscene" JSONB,
    "outro_cutscene" JSONB,
    "npcs" JSONB,
    "dialogue_tree" JSONB,
    "allow_replay" BOOLEAN NOT NULL DEFAULT true,
    "time_limit_minutes" INTEGER,
    "difficulty_modifier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "times_started" INTEGER NOT NULL DEFAULT 0,
    "times_completed" INTEGER NOT NULL DEFAULT 0,
    "avg_completion_time" INTEGER,
    "completion_rate" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quest_progress" (
    "id" TEXT NOT NULL,
    "housekeeper_id" TEXT NOT NULL,
    "quest_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'locked',
    "objectives_state" JSONB NOT NULL,
    "completion_percent" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "total_time_minutes" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "xp_earned" INTEGER NOT NULL DEFAULT 0,
    "badges_unlocked" TEXT[],
    "items_unlocked" TEXT[],
    "perfect_completion" BOOLEAN NOT NULL DEFAULT false,
    "speed_bonus_claimed" BOOLEAN NOT NULL DEFAULT false,
    "last_played" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quest_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "world_progress" (
    "id" TEXT NOT NULL,
    "housekeeper_id" TEXT NOT NULL,
    "world_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'locked',
    "quests_completed" INTEGER NOT NULL DEFAULT 0,
    "quests_total" INTEGER NOT NULL DEFAULT 0,
    "completion_percent" INTEGER NOT NULL DEFAULT 0,
    "boss_unlocked" BOOLEAN NOT NULL DEFAULT false,
    "boss_defeated" BOOLEAN NOT NULL DEFAULT false,
    "boss_attempts" INTEGER NOT NULL DEFAULT 0,
    "unlocked_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "total_xp_earned" INTEGER NOT NULL DEFAULT 0,
    "total_time_minutes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "world_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boss_battles" (
    "id" TEXT NOT NULL,
    "world_id" TEXT NOT NULL,
    "boss_name" TEXT NOT NULL,
    "boss_title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "narrative_intro" TEXT NOT NULL,
    "narrative_victory" TEXT NOT NULL,
    "narrative_defeat" TEXT NOT NULL,
    "boss_avatar" TEXT NOT NULL,
    "boss_model_3d" TEXT,
    "arena_background" TEXT,
    "battle_music_url" TEXT,
    "challenge_type" TEXT NOT NULL DEFAULT 'quiz_gauntlet',
    "challenge_data" JSONB NOT NULL,
    "difficulty_level" INTEGER NOT NULL DEFAULT 5,
    "min_cecrl_level" TEXT NOT NULL,
    "time_limit_minutes" INTEGER,
    "xp_reward" INTEGER NOT NULL DEFAULT 2500,
    "badge_reward" TEXT NOT NULL,
    "item_rewards" TEXT[],
    "unlock_next_world" BOOLEAN NOT NULL DEFAULT true,
    "has_phases" BOOLEAN NOT NULL DEFAULT false,
    "phases_data" JSONB,
    "special_mechanics" JSONB,
    "times_attempted" INTEGER NOT NULL DEFAULT 0,
    "times_defeated" INTEGER NOT NULL DEFAULT 0,
    "avg_attempts" DOUBLE PRECISION,
    "defeat_rate" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boss_battles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boss_battle_attempts" (
    "id" TEXT NOT NULL,
    "housekeeper_id" TEXT NOT NULL,
    "boss_battle_id" TEXT NOT NULL,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "score" INTEGER NOT NULL DEFAULT 0,
    "accuracy_percent" DOUBLE PRECISION,
    "time_taken_minutes" INTEGER,
    "lives_remaining" INTEGER,
    "rounds_completed" INTEGER NOT NULL DEFAULT 0,
    "current_round_data" JSONB,
    "answers_log" JSONB,
    "victory" BOOLEAN NOT NULL DEFAULT false,
    "xp_earned" INTEGER NOT NULL DEFAULT 0,
    "badges_unlocked" TEXT[],
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "boss_battle_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quest_dialogues" (
    "id" TEXT NOT NULL,
    "dialogue_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dialogue_tree" JSONB NOT NULL,
    "npcs" JSONB NOT NULL,
    "has_voice" BOOLEAN NOT NULL DEFAULT false,
    "voice_urls" JSONB,
    "min_level" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "vocabulary_focus" TEXT[],
    "grammar_focus" TEXT[],
    "times_played" INTEGER NOT NULL DEFAULT 0,
    "avg_success_rate" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quest_dialogues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hero_avatars" (
    "id" TEXT NOT NULL,
    "housekeeper_id" TEXT NOT NULL,
    "base_model" TEXT NOT NULL DEFAULT 'default',
    "skin_tone" TEXT NOT NULL DEFAULT 'medium',
    "hair_style" TEXT NOT NULL DEFAULT 'short',
    "hair_color" TEXT NOT NULL DEFAULT 'brown',
    "outfit" TEXT NOT NULL DEFAULT 'casual',
    "accessories" TEXT[],
    "equipped_items" JSONB NOT NULL,
    "model_config" JSONB,
    "animation_set" TEXT NOT NULL DEFAULT 'standard',
    "hero_name" TEXT,
    "hero_title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_avatars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quest_cinematics" (
    "id" TEXT NOT NULL,
    "cinematic_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scenes" JSONB NOT NULL,
    "background_music" TEXT,
    "sound_effects" JSONB,
    "duration_seconds" INTEGER NOT NULL,
    "skippable" BOOLEAN NOT NULL DEFAULT true,
    "auto_advance" BOOLEAN NOT NULL DEFAULT true,
    "related_world_id" TEXT,
    "related_quest_id" TEXT,
    "related_boss_id" TEXT,
    "times_viewed" INTEGER NOT NULL DEFAULT 0,
    "times_skipped" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quest_cinematics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversalQuizQuestion" (
    "id" TEXT NOT NULL,
    "question_type" "QuestionType" NOT NULL,
    "skill_category" "SkillCategory" NOT NULL,
    "difficulty_level" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "question_text" TEXT,
    "question_audio_url" TEXT,
    "question_image_url" TEXT,
    "options" JSONB NOT NULL,
    "correct_answer" JSONB NOT NULL,
    "explanation_text" TEXT NOT NULL,
    "explanation_audio_url" TEXT,
    "times_shown" INTEGER NOT NULL DEFAULT 0,
    "times_correct" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniversalQuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversalQuizResponse" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "housekeeper_id" TEXT NOT NULL,
    "user_answer" JSONB NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "session_id" TEXT,
    "time_taken_seconds" INTEGER,
    "xp_earned" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UniversalQuizResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "missions" (
    "id" TEXT NOT NULL,
    "housekeeper_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "mission_type" TEXT NOT NULL,
    "property" JSONB,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "scheduled_start_time" TEXT,
    "estimated_duration_min" INTEGER,
    "access_code" TEXT,
    "access_instructions" TEXT,
    "smoking_policy" TEXT,
    "expected_occupancy" TEXT,
    "occupancy_note" TEXT,
    "instructions" TEXT,
    "manager_notes" TEXT,
    "tasks" JSONB,
    "manager_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "mission_id" TEXT NOT NULL,
    "incident_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "gps_position" JSONB,
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "manager_called" BOOLEAN NOT NULL DEFAULT false,
    "manager_called_at" TIMESTAMP(3),
    "notes" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolution" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sos_events" (
    "id" TEXT NOT NULL,
    "mission_id" TEXT NOT NULL,
    "sos_category" TEXT NOT NULL,
    "sos_action" TEXT,
    "gps_position" JSONB,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_at" TIMESTAMP(3),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sos_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evacuation_events" (
    "id" TEXT NOT NULL,
    "mission_id" TEXT NOT NULL,
    "motivation_id" TEXT NOT NULL,
    "motivation_label" TEXT NOT NULL,
    "custom_reason" TEXT,
    "gps_position" JSONB,
    "employer_notified" BOOLEAN NOT NULL DEFAULT false,
    "employer_notified_at" TIMESTAMP(3),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evacuation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pointages" (
    "id" TEXT NOT NULL,
    "mission_checkin_id" TEXT,
    "mission_checkout_id" TEXT,
    "pointage_method" TEXT NOT NULL,
    "gps_position" JSONB,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pointages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_reports" (
    "id" TEXT NOT NULL,
    "mission_id" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "validity" TEXT NOT NULL,
    "tasks_completed" INTEGER NOT NULL DEFAULT 0,
    "tasks_total" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "photos" JSONB NOT NULL DEFAULT '[]',
    "pending_evidence" JSONB NOT NULL DEFAULT '[]',
    "signature" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_alerts" (
    "id" TEXT NOT NULL,
    "housekeeper_id" TEXT NOT NULL,
    "mission_id" TEXT,
    "alert_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "attempted_location" JSONB,
    "expected_location" JSONB,
    "status" TEXT NOT NULL DEFAULT 'unread',
    "acknowledged_by" TEXT,
    "acknowledged_at" TIMESTAMP(3),
    "resolution_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsLog" (
    "id" TEXT NOT NULL,
    "messageSid" TEXT,
    "destinataire" TEXT NOT NULL,
    "messageContenu" TEXT NOT NULL,
    "messageResume" TEXT,
    "type" TEXT NOT NULL,
    "statut" TEXT NOT NULL,
    "raison" TEXT,
    "codeErreur" INTEGER,
    "dureeMs" INTEGER,
    "idUtilisateur" TEXT,
    "tentatives" INTEGER NOT NULL DEFAULT 1,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateEnvoi" TIMESTAMP(3),
    "dateLivraison" TIMESTAMP(3),
    "dateExpiration" TIMESTAMP(3),
    "fateProfile" TEXT,
    "templateName" TEXT,
    "fateConfidence" DOUBLE PRECISION,

    CONSTRAINT "SmsLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fate_profiles" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "guestPhone" TEXT NOT NULL,
    "profile" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reasons" TEXT[],
    "nbGuests" INTEGER,
    "duration" INTEGER,
    "propertyType" TEXT,
    "hasChildren" BOOLEAN NOT NULL DEFAULT false,
    "keywordsFound" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fate_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlocklistSms" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "raison" TEXT NOT NULL,
    "dateAjout" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,
    "motif" TEXT,

    CONSTRAINT "BlocklistSms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentementSms" (
    "id" TEXT NOT NULL,
    "idUtilisateur" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "consentement" BOOLEAN NOT NULL DEFAULT false,
    "typeConsent" TEXT[],
    "dateConsent" TIMESTAMP(3),
    "dateRevocation" TIMESTAMP(3),
    "ipAdresse" TEXT,
    "userAgent" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsentementSms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_access" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "granted_by" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "reason" TEXT,

    CONSTRAINT "internal_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_assets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "sensitivity_level" INTEGER NOT NULL DEFAULT 1,
    "contains_pii" BOOLEAN NOT NULL DEFAULT false,
    "pii_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "legal_basis" TEXT NOT NULL DEFAULT 'legitimate_interest',
    "source_systems" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "volume_records" INTEGER NOT NULL DEFAULT 0,
    "freshness_hours" DOUBLE PRECISION NOT NULL DEFAULT 24,
    "quality_score" INTEGER NOT NULL DEFAULT 0,
    "uniqueness_score" INTEGER NOT NULL DEFAULT 0,
    "demand_score" INTEGER NOT NULL DEFAULT 0,
    "freshness_score" INTEGER NOT NULL DEFAULT 0,
    "monetization_score" INTEGER NOT NULL DEFAULT 0,
    "pipeline_stage" TEXT NOT NULL DEFAULT 'raw',
    "anonymization_level" TEXT NOT NULL DEFAULT 'raw',
    "base_price_per_1000" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimated_revenue_min" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimated_revenue_max" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "eligible_models" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classification_history" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'claude_api',
    "result" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classification_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_checks" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "regulation" TEXT NOT NULL,
    "check_name" TEXT NOT NULL,
    "description" TEXT,
    "article" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_products" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "pricing_tiers" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'analytics',
    "tier" TEXT NOT NULL DEFAULT 'free',
    "contract_status" TEXT NOT NULL DEFAULT 'prospect',
    "stripe_customer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "rate_limit_per_minute" INTEGER NOT NULL DEFAULT 10,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_type" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicLink" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Owner" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "company" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "zipCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'FR',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "checkInTime" TEXT NOT NULL DEFAULT '15:00',
    "checkOutTime" TEXT NOT NULL DEFAULT '11:00',
    "wifiName" TEXT,
    "wifiPassword" TEXT,
    "houseRules" JSONB,
    "cameras" JSONB,
    "pets" JSONB,
    "alarms" JSONB,
    "imageUrls" TEXT[],
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "guestCount" INTEGER NOT NULL DEFAULT 1,
    "status" "ReservationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "source" TEXT,
    "checkinDone" BOOLEAN NOT NULL DEFAULT false,
    "checkoutDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "labelEn" TEXT,
    "labelEs" TEXT,
    "order" INTEGER NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistCompletion" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "checklistItemId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "photoUrl" TEXT,

    CONSTRAINT "ChecklistCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestMessage" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderType" "SenderType" NOT NULL,
    "content" TEXT NOT NULL,
    "translatedContent" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT,
    "category" "ServiceCategory" NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "imageUrl" TEXT,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "stock" INTEGER,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "stripePaymentId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "overall" INTEGER NOT NULL,
    "cleanliness" INTEGER,
    "communication" INTEGER,
    "location" INTEGER,
    "comfort" INTEGER,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportPoint" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TransportType" NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "distanceMeters" INTEGER NOT NULL,
    "walkMinutes" INTEGER,
    "transitMinutes" INTEGER,
    "driveMinutes" INTEGER,
    "notes" TEXT,
    "notesEn" TEXT,

    CONSTRAINT "TransportPoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_email_key" ON "organizations"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Guest_email_key" ON "Guest"("email");

-- CreateIndex
CREATE INDEX "Guest_email_idx" ON "Guest"("email");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_confirmation_code_key" ON "bookings"("confirmation_code");

-- CreateIndex
CREATE UNIQUE INDEX "housekeeping_company_progressions_company_id_key" ON "housekeeping_company_progressions"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "housekeepers_company_id_email_key" ON "housekeepers"("company_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "language_progress_housekeeper_id_key" ON "language_progress"("housekeeper_id");

-- CreateIndex
CREATE INDEX "language_quiz_questions_level_idx" ON "language_quiz_questions"("level");

-- CreateIndex
CREATE INDEX "language_quiz_questions_category_idx" ON "language_quiz_questions"("category");

-- CreateIndex
CREATE INDEX "language_quiz_questions_difficulty_idx" ON "language_quiz_questions"("difficulty");

-- CreateIndex
CREATE INDEX "language_quiz_responses_housekeeper_id_idx" ON "language_quiz_responses"("housekeeper_id");

-- CreateIndex
CREATE INDEX "language_quiz_responses_question_id_idx" ON "language_quiz_responses"("question_id");

-- CreateIndex
CREATE INDEX "language_quiz_responses_session_id_idx" ON "language_quiz_responses"("session_id");

-- CreateIndex
CREATE INDEX "cleaning_quiz_questions_category_idx" ON "cleaning_quiz_questions"("category");

-- CreateIndex
CREATE INDEX "cleaning_quiz_questions_difficulty_idx" ON "cleaning_quiz_questions"("difficulty");

-- CreateIndex
CREATE INDEX "cleaning_quiz_questions_required_for_cert_idx" ON "cleaning_quiz_questions"("required_for_cert");

-- CreateIndex
CREATE INDEX "cleaning_quiz_responses_housekeeper_id_idx" ON "cleaning_quiz_responses"("housekeeper_id");

-- CreateIndex
CREATE INDEX "cleaning_quiz_responses_question_id_idx" ON "cleaning_quiz_responses"("question_id");

-- CreateIndex
CREATE INDEX "cleaning_quiz_responses_session_id_idx" ON "cleaning_quiz_responses"("session_id");

-- CreateIndex
CREATE INDEX "items_type_idx" ON "items"("type");

-- CreateIndex
CREATE INDEX "items_rarity_idx" ON "items"("rarity");

-- CreateIndex
CREATE INDEX "items_available_for_purchase_idx" ON "items"("available_for_purchase");

-- CreateIndex
CREATE INDEX "trades_seller_id_idx" ON "trades"("seller_id");

-- CreateIndex
CREATE INDEX "trades_buyer_id_idx" ON "trades"("buyer_id");

-- CreateIndex
CREATE INDEX "trades_status_idx" ON "trades"("status");

-- CreateIndex
CREATE INDEX "knowledge_base_entries_organization_id_idx" ON "knowledge_base_entries"("organization_id");

-- CreateIndex
CREATE INDEX "knowledge_base_entries_category_idx" ON "knowledge_base_entries"("category");

-- CreateIndex
CREATE INDEX "knowledge_base_entries_language_idx" ON "knowledge_base_entries"("language");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_metrics_conversation_id_key" ON "conversation_metrics"("conversation_id");

-- CreateIndex
CREATE INDEX "conversation_metrics_organization_id_idx" ON "conversation_metrics"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "quest_worlds_world_number_key" ON "quest_worlds"("world_number");

-- CreateIndex
CREATE UNIQUE INDEX "quest_worlds_display_order_key" ON "quest_worlds"("display_order");

-- CreateIndex
CREATE INDEX "quest_worlds_world_number_idx" ON "quest_worlds"("world_number");

-- CreateIndex
CREATE INDEX "quest_worlds_display_order_idx" ON "quest_worlds"("display_order");

-- CreateIndex
CREATE INDEX "quests_world_id_idx" ON "quests"("world_id");

-- CreateIndex
CREATE INDEX "quests_type_idx" ON "quests"("type");

-- CreateIndex
CREATE UNIQUE INDEX "quests_world_id_quest_number_key" ON "quests"("world_id", "quest_number");

-- CreateIndex
CREATE INDEX "quest_progress_housekeeper_id_idx" ON "quest_progress"("housekeeper_id");

-- CreateIndex
CREATE INDEX "quest_progress_quest_id_idx" ON "quest_progress"("quest_id");

-- CreateIndex
CREATE INDEX "quest_progress_status_idx" ON "quest_progress"("status");

-- CreateIndex
CREATE UNIQUE INDEX "quest_progress_housekeeper_id_quest_id_key" ON "quest_progress"("housekeeper_id", "quest_id");

-- CreateIndex
CREATE INDEX "world_progress_housekeeper_id_idx" ON "world_progress"("housekeeper_id");

-- CreateIndex
CREATE INDEX "world_progress_world_id_idx" ON "world_progress"("world_id");

-- CreateIndex
CREATE INDEX "world_progress_status_idx" ON "world_progress"("status");

-- CreateIndex
CREATE UNIQUE INDEX "world_progress_housekeeper_id_world_id_key" ON "world_progress"("housekeeper_id", "world_id");

-- CreateIndex
CREATE UNIQUE INDEX "boss_battles_world_id_key" ON "boss_battles"("world_id");

-- CreateIndex
CREATE INDEX "boss_battles_world_id_idx" ON "boss_battles"("world_id");

-- CreateIndex
CREATE INDEX "boss_battle_attempts_housekeeper_id_idx" ON "boss_battle_attempts"("housekeeper_id");

-- CreateIndex
CREATE INDEX "boss_battle_attempts_boss_battle_id_idx" ON "boss_battle_attempts"("boss_battle_id");

-- CreateIndex
CREATE INDEX "boss_battle_attempts_status_idx" ON "boss_battle_attempts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "quest_dialogues_dialogue_id_key" ON "quest_dialogues"("dialogue_id");

-- CreateIndex
CREATE INDEX "quest_dialogues_dialogue_id_idx" ON "quest_dialogues"("dialogue_id");

-- CreateIndex
CREATE INDEX "quest_dialogues_category_idx" ON "quest_dialogues"("category");

-- CreateIndex
CREATE UNIQUE INDEX "hero_avatars_housekeeper_id_key" ON "hero_avatars"("housekeeper_id");

-- CreateIndex
CREATE UNIQUE INDEX "quest_cinematics_cinematic_id_key" ON "quest_cinematics"("cinematic_id");

-- CreateIndex
CREATE INDEX "quest_cinematics_cinematic_id_idx" ON "quest_cinematics"("cinematic_id");

-- CreateIndex
CREATE INDEX "quest_cinematics_type_idx" ON "quest_cinematics"("type");

-- CreateIndex
CREATE INDEX "UniversalQuizQuestion_question_type_difficulty_level_idx" ON "UniversalQuizQuestion"("question_type", "difficulty_level");

-- CreateIndex
CREATE INDEX "UniversalQuizQuestion_skill_category_category_idx" ON "UniversalQuizQuestion"("skill_category", "category");

-- CreateIndex
CREATE INDEX "UniversalQuizResponse_housekeeper_id_created_at_idx" ON "UniversalQuizResponse"("housekeeper_id", "created_at");

-- CreateIndex
CREATE INDEX "UniversalQuizResponse_session_id_idx" ON "UniversalQuizResponse"("session_id");

-- CreateIndex
CREATE INDEX "missions_housekeeper_id_scheduled_date_idx" ON "missions"("housekeeper_id", "scheduled_date");

-- CreateIndex
CREATE INDEX "missions_status_idx" ON "missions"("status");

-- CreateIndex
CREATE INDEX "incidents_mission_id_idx" ON "incidents"("mission_id");

-- CreateIndex
CREATE INDEX "incidents_severity_idx" ON "incidents"("severity");

-- CreateIndex
CREATE INDEX "sos_events_mission_id_idx" ON "sos_events"("mission_id");

-- CreateIndex
CREATE UNIQUE INDEX "evacuation_events_mission_id_key" ON "evacuation_events"("mission_id");

-- CreateIndex
CREATE INDEX "evacuation_events_mission_id_idx" ON "evacuation_events"("mission_id");

-- CreateIndex
CREATE UNIQUE INDEX "pointages_mission_checkin_id_key" ON "pointages"("mission_checkin_id");

-- CreateIndex
CREATE UNIQUE INDEX "pointages_mission_checkout_id_key" ON "pointages"("mission_checkout_id");

-- CreateIndex
CREATE INDEX "pointages_mission_checkin_id_idx" ON "pointages"("mission_checkin_id");

-- CreateIndex
CREATE INDEX "pointages_mission_checkout_id_idx" ON "pointages"("mission_checkout_id");

-- CreateIndex
CREATE UNIQUE INDEX "mission_reports_mission_id_key" ON "mission_reports"("mission_id");

-- CreateIndex
CREATE INDEX "mission_reports_mission_id_idx" ON "mission_reports"("mission_id");

-- CreateIndex
CREATE INDEX "mission_reports_validity_idx" ON "mission_reports"("validity");

-- CreateIndex
CREATE INDEX "security_alerts_housekeeper_id_idx" ON "security_alerts"("housekeeper_id");

-- CreateIndex
CREATE INDEX "security_alerts_mission_id_idx" ON "security_alerts"("mission_id");

-- CreateIndex
CREATE INDEX "security_alerts_alert_type_idx" ON "security_alerts"("alert_type");

-- CreateIndex
CREATE INDEX "security_alerts_severity_idx" ON "security_alerts"("severity");

-- CreateIndex
CREATE INDEX "security_alerts_status_idx" ON "security_alerts"("status");

-- CreateIndex
CREATE INDEX "security_alerts_created_at_idx" ON "security_alerts"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "SmsLog_messageSid_key" ON "SmsLog"("messageSid");

-- CreateIndex
CREATE INDEX "SmsLog_destinataire_idx" ON "SmsLog"("destinataire");

-- CreateIndex
CREATE INDEX "SmsLog_statut_idx" ON "SmsLog"("statut");

-- CreateIndex
CREATE INDEX "SmsLog_dateCreation_idx" ON "SmsLog"("dateCreation");

-- CreateIndex
CREATE INDEX "SmsLog_type_idx" ON "SmsLog"("type");

-- CreateIndex
CREATE INDEX "SmsLog_fateProfile_idx" ON "SmsLog"("fateProfile");

-- CreateIndex
CREATE INDEX "fate_profiles_profile_idx" ON "fate_profiles"("profile");

-- CreateIndex
CREATE INDEX "fate_profiles_guestPhone_idx" ON "fate_profiles"("guestPhone");

-- CreateIndex
CREATE INDEX "fate_profiles_bookingId_idx" ON "fate_profiles"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "BlocklistSms_numero_key" ON "BlocklistSms"("numero");

-- CreateIndex
CREATE INDEX "BlocklistSms_numero_idx" ON "BlocklistSms"("numero");

-- CreateIndex
CREATE INDEX "ConsentementSms_numero_idx" ON "ConsentementSms"("numero");

-- CreateIndex
CREATE INDEX "ConsentementSms_dateCreation_idx" ON "ConsentementSms"("dateCreation");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentementSms_idUtilisateur_numero_key" ON "ConsentementSms"("idUtilisateur", "numero");

-- CreateIndex
CREATE INDEX "internal_access_user_id_is_active_idx" ON "internal_access"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "internal_access_user_id_key" ON "internal_access"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "data_assets_slug_key" ON "data_assets"("slug");

-- CreateIndex
CREATE INDEX "data_assets_category_idx" ON "data_assets"("category");

-- CreateIndex
CREATE INDEX "data_assets_pipeline_stage_idx" ON "data_assets"("pipeline_stage");

-- CreateIndex
CREATE INDEX "data_assets_monetization_score_idx" ON "data_assets"("monetization_score");

-- CreateIndex
CREATE INDEX "classification_history_asset_id_idx" ON "classification_history"("asset_id");

-- CreateIndex
CREATE INDEX "compliance_checks_asset_id_idx" ON "compliance_checks"("asset_id");

-- CreateIndex
CREATE INDEX "compliance_checks_regulation_idx" ON "compliance_checks"("regulation");

-- CreateIndex
CREATE UNIQUE INDEX "partners_email_key" ON "partners"("email");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "api_keys_prefix_idx" ON "api_keys"("prefix");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "MagicLink_token_key" ON "MagicLink"("token");

-- CreateIndex
CREATE INDEX "MagicLink_token_idx" ON "MagicLink"("token");

-- CreateIndex
CREATE INDEX "MagicLink_email_idx" ON "MagicLink"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Owner_email_key" ON "Owner"("email");

-- CreateIndex
CREATE INDEX "Property_ownerId_idx" ON "Property"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_code_key" ON "Reservation"("code");

-- CreateIndex
CREATE INDEX "Reservation_guestId_idx" ON "Reservation"("guestId");

-- CreateIndex
CREATE INDEX "Reservation_propertyId_idx" ON "Reservation"("propertyId");

-- CreateIndex
CREATE INDEX "Reservation_code_idx" ON "Reservation"("code");

-- CreateIndex
CREATE INDEX "ChecklistItem_propertyId_idx" ON "ChecklistItem"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistCompletion_reservationId_checklistItemId_key" ON "ChecklistCompletion"("reservationId", "checklistItemId");

-- CreateIndex
CREATE INDEX "GuestMessage_reservationId_createdAt_idx" ON "GuestMessage"("reservationId", "createdAt");

-- CreateIndex
CREATE INDEX "Service_propertyId_category_idx" ON "Service"("propertyId", "category");

-- CreateIndex
CREATE INDEX "Order_reservationId_idx" ON "Order"("reservationId");

-- CreateIndex
CREATE INDEX "Order_guestId_idx" ON "Order"("guestId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_reservationId_key" ON "Rating"("reservationId");

-- CreateIndex
CREATE INDEX "Rating_guestId_idx" ON "Rating"("guestId");

-- CreateIndex
CREATE INDEX "TransportPoint_propertyId_type_idx" ON "TransportPoint"("propertyId", "type");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "housekeeping_company_progressions" ADD CONSTRAINT "housekeeping_company_progressions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "housekeeping_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "housekeepers" ADD CONSTRAINT "housekeepers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "housekeeping_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "language_progress" ADD CONSTRAINT "language_progress_housekeeper_id_fkey" FOREIGN KEY ("housekeeper_id") REFERENCES "housekeepers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "language_quiz_responses" ADD CONSTRAINT "language_quiz_responses_housekeeper_id_fkey" FOREIGN KEY ("housekeeper_id") REFERENCES "language_progress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "language_quiz_responses" ADD CONSTRAINT "language_quiz_responses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "language_quiz_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cleaning_quiz_responses" ADD CONSTRAINT "cleaning_quiz_responses_housekeeper_id_fkey" FOREIGN KEY ("housekeeper_id") REFERENCES "language_progress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cleaning_quiz_responses" ADD CONSTRAINT "cleaning_quiz_responses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "cleaning_quiz_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_item1_id_fkey" FOREIGN KEY ("item1_id") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_item2_id_fkey" FOREIGN KEY ("item2_id") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quests" ADD CONSTRAINT "quests_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "quest_worlds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest_progress" ADD CONSTRAINT "quest_progress_quest_id_fkey" FOREIGN KEY ("quest_id") REFERENCES "quests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "world_progress" ADD CONSTRAINT "world_progress_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "quest_worlds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boss_battles" ADD CONSTRAINT "boss_battles_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "quest_worlds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boss_battle_attempts" ADD CONSTRAINT "boss_battle_attempts_boss_battle_id_fkey" FOREIGN KEY ("boss_battle_id") REFERENCES "boss_battles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversalQuizResponse" ADD CONSTRAINT "UniversalQuizResponse_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "UniversalQuizQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversalQuizResponse" ADD CONSTRAINT "UniversalQuizResponse_housekeeper_id_fkey" FOREIGN KEY ("housekeeper_id") REFERENCES "housekeepers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_housekeeper_id_fkey" FOREIGN KEY ("housekeeper_id") REFERENCES "housekeepers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_events" ADD CONSTRAINT "sos_events_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evacuation_events" ADD CONSTRAINT "evacuation_events_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pointages" ADD CONSTRAINT "pointages_mission_checkin_id_fkey" FOREIGN KEY ("mission_checkin_id") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pointages" ADD CONSTRAINT "pointages_mission_checkout_id_fkey" FOREIGN KEY ("mission_checkout_id") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_reports" ADD CONSTRAINT "mission_reports_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_alerts" ADD CONSTRAINT "security_alerts_housekeeper_id_fkey" FOREIGN KEY ("housekeeper_id") REFERENCES "housekeepers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_alerts" ADD CONSTRAINT "security_alerts_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classification_history" ADD CONSTRAINT "classification_history_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "data_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_checks" ADD CONSTRAINT "compliance_checks_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "data_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_products" ADD CONSTRAINT "data_products_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "data_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistCompletion" ADD CONSTRAINT "ChecklistCompletion_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistCompletion" ADD CONSTRAINT "ChecklistCompletion_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "ChecklistItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestMessage" ADD CONSTRAINT "GuestMessage_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestMessage" ADD CONSTRAINT "GuestMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Guest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportPoint" ADD CONSTRAINT "TransportPoint_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
