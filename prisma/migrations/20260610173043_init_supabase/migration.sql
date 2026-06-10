-- CreateTable
CREATE TABLE "account_emailaddress" (
    "id" SERIAL NOT NULL,
    "verified" BOOLEAN NOT NULL,
    "primary" BOOLEAN NOT NULL,
    "user_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "account_emailaddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_emailconfirmation" (
    "id" SERIAL NOT NULL,
    "created" TIMESTAMP(3) NOT NULL,
    "sent" TIMESTAMP(3),
    "key" TEXT NOT NULL,
    "email_address_id" INTEGER NOT NULL,

    CONSTRAINT "account_emailconfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts_user" (
    "id" SERIAL NOT NULL,
    "password" TEXT NOT NULL,
    "last_login" TIMESTAMP(3),
    "is_superuser" BOOLEAN NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "is_staff" BOOLEAN NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "date_joined" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_profile_complete" BOOLEAN NOT NULL,
    "role" TEXT,

    CONSTRAINT "accounts_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts_user_groups" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,

    CONSTRAINT "accounts_user_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts_user_user_permissions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,

    CONSTRAINT "accounts_user_user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_group" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "auth_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_group_permissions" (
    "id" SERIAL NOT NULL,
    "group_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,

    CONSTRAINT "auth_group_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_permission" (
    "id" SERIAL NOT NULL,
    "content_type_id" INTEGER NOT NULL,
    "codename" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "auth_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "django_admin_log" (
    "id" SERIAL NOT NULL,
    "object_id" TEXT,
    "object_repr" TEXT NOT NULL,
    "action_flag" INTEGER NOT NULL,
    "change_message" TEXT NOT NULL,
    "content_type_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    "action_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "django_admin_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "django_celery_beat_clockedschedule" (
    "id" SERIAL NOT NULL,
    "clocked_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "django_celery_beat_clockedschedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "django_celery_beat_crontabschedule" (
    "id" SERIAL NOT NULL,
    "minute" TEXT NOT NULL,
    "hour" TEXT NOT NULL,
    "day_of_week" TEXT NOT NULL,
    "day_of_month" TEXT NOT NULL,
    "month_of_year" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,

    CONSTRAINT "django_celery_beat_crontabschedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "django_celery_beat_intervalschedule" (
    "id" SERIAL NOT NULL,
    "every" INTEGER NOT NULL,
    "period" TEXT NOT NULL,

    CONSTRAINT "django_celery_beat_intervalschedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "django_celery_beat_periodictask" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "args" TEXT NOT NULL,
    "kwargs" TEXT NOT NULL,
    "queue" TEXT,
    "exchange" TEXT,
    "routing_key" TEXT,
    "expires" TIMESTAMP(3),
    "enabled" BOOLEAN NOT NULL,
    "last_run_at" TIMESTAMP(3),
    "total_run_count" INTEGER NOT NULL,
    "date_changed" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "crontab_id" INTEGER,
    "interval_id" INTEGER,
    "solar_id" INTEGER,
    "one_off" BOOLEAN NOT NULL,
    "start_time" TIMESTAMP(3),
    "priority" INTEGER,
    "headers" TEXT NOT NULL,
    "clocked_id" INTEGER,
    "expire_seconds" INTEGER,

    CONSTRAINT "django_celery_beat_periodictask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "django_celery_beat_periodictasks" (
    "ident" INTEGER NOT NULL,
    "last_update" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "django_celery_beat_periodictasks_pkey" PRIMARY KEY ("ident")
);

-- CreateTable
CREATE TABLE "django_celery_beat_solarschedule" (
    "id" SERIAL NOT NULL,
    "event" TEXT NOT NULL,
    "latitude" DECIMAL(65,30) NOT NULL,
    "longitude" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "django_celery_beat_solarschedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "django_content_type" (
    "id" SERIAL NOT NULL,
    "app_label" TEXT NOT NULL,
    "model" TEXT NOT NULL,

    CONSTRAINT "django_content_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "django_migrations" (
    "id" SERIAL NOT NULL,
    "app" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "applied" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "django_migrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "django_session" (
    "session_key" TEXT NOT NULL,
    "session_data" TEXT NOT NULL,
    "expire_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "django_session_pkey" PRIMARY KEY ("session_key")
);

-- CreateTable
CREATE TABLE "django_site" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,

    CONSTRAINT "django_site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizer_hackathon" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "registration_deadline" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "min_team_size" INTEGER NOT NULL,
    "max_team_size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "organizer_id" INTEGER NOT NULL,
    "room_configuration" TEXT,
    "seating_allocation" TEXT,
    "fee_amount" DECIMAL(65,30),
    "fee_type" TEXT,
    "is_paid" BOOLEAN NOT NULL,

    CONSTRAINT "organizer_hackathon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizer_hackathoncoordinator" (
    "id" SERIAL NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "hackathon_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "organizer_hackathoncoordinator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizer_organizerprofile" (
    "id" SERIAL NOT NULL,
    "organization_name" TEXT NOT NULL,
    "website" TEXT,
    "logo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "organizer_organizerprofile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizer_problemstatement" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pdf_file" TEXT,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "hackathon_id" INTEGER NOT NULL,
    "max_teams_allowed" INTEGER NOT NULL,

    CONSTRAINT "organizer_problemstatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizer_scancategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "display_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "hackathon_id" INTEGER NOT NULL,

    CONSTRAINT "organizer_scancategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizer_scanrecord" (
    "id" SERIAL NOT NULL,
    "device_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "scan_category_id" INTEGER NOT NULL,
    "scanned_by_id" INTEGER NOT NULL,
    "team_member_id" INTEGER NOT NULL,

    CONSTRAINT "organizer_scanrecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant_participantprofile" (
    "id" SERIAL NOT NULL,
    "college" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "degree" TEXT NOT NULL,
    "visibility" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "participant_participantprofile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant_participantprofile_skills" (
    "id" SERIAL NOT NULL,
    "participantprofile_id" INTEGER NOT NULL,
    "skill_id" INTEGER NOT NULL,

    CONSTRAINT "participant_participantprofile_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant_payment" (
    "id" SERIAL NOT NULL,
    "razorpay_order_id" TEXT NOT NULL,
    "razorpay_payment_id" TEXT,
    "razorpay_signature" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "team_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "participant_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant_skill" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "participant_skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant_team" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "qr_code" TEXT,
    "food_tokens_total" INTEGER NOT NULL,
    "food_tokens_used" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "hackathon_id" INTEGER NOT NULL,
    "leader_id" INTEGER NOT NULL,
    "selected_problem_statement_id" INTEGER,
    "is_registered" BOOLEAN NOT NULL,
    "is_qr_active" BOOLEAN NOT NULL,
    "qr_token" TEXT,
    "invite_token" TEXT,

    CONSTRAINT "participant_team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant_teammember" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "college" TEXT NOT NULL,
    "semester" INTEGER,
    "degree" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "team_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "participant_teammember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant_teammember_skills" (
    "id" SERIAL NOT NULL,
    "teammember_id" INTEGER NOT NULL,
    "skill_id" INTEGER NOT NULL,

    CONSTRAINT "participant_teammember_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant_teamrequest" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "receiver_id" INTEGER NOT NULL,
    "team_id" INTEGER NOT NULL,

    CONSTRAINT "participant_teamrequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "socialaccount_socialaccount" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "last_login" TIMESTAMP(3) NOT NULL,
    "date_joined" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "extra_data" TEXT NOT NULL,

    CONSTRAINT "socialaccount_socialaccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "socialaccount_socialapp" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "settings" TEXT NOT NULL,

    CONSTRAINT "socialaccount_socialapp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "socialaccount_socialapp_sites" (
    "id" SERIAL NOT NULL,
    "socialapp_id" INTEGER NOT NULL,
    "site_id" INTEGER NOT NULL,

    CONSTRAINT "socialaccount_socialapp_sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "socialaccount_socialtoken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "token_secret" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "account_id" INTEGER NOT NULL,
    "app_id" INTEGER,

    CONSTRAINT "socialaccount_socialtoken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "account_emailaddress_email_03be32b2" ON "account_emailaddress"("email");

-- CreateIndex
CREATE INDEX "account_emailaddress_user_id_2c513194" ON "account_emailaddress"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_emailaddress_user_id_email_987c8728_uniq" ON "account_emailaddress"("user_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_account_emailconfirmation_1" ON "account_emailconfirmation"("key");

-- CreateIndex
CREATE INDEX "account_emailconfirmation_email_address_id_5b7f8c58" ON "account_emailconfirmation"("email_address_id");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_accounts_user_1" ON "accounts_user"("email");

-- CreateIndex
CREATE INDEX "accounts_user_groups_group_id_bd11a704" ON "accounts_user_groups"("group_id");

-- CreateIndex
CREATE INDEX "accounts_user_groups_user_id_52b62117" ON "accounts_user_groups"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_user_groups_user_id_group_id_59c0b32f_uniq" ON "accounts_user_groups"("user_id", "group_id");

-- CreateIndex
CREATE INDEX "accounts_user_user_permissions_permission_id_113bb443" ON "accounts_user_user_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "accounts_user_user_permissions_user_id_e4f0a161" ON "accounts_user_user_permissions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_user_user_perms_uid_pid_uniq" ON "accounts_user_user_permissions"("user_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_auth_group_1" ON "auth_group"("name");

-- CreateIndex
CREATE INDEX "auth_group_permissions_permission_id_84c5c92e" ON "auth_group_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "auth_group_permissions_group_id_b120cbf9" ON "auth_group_permissions"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_group_permissions_group_id_permission_id_0cd325b0_uniq" ON "auth_group_permissions"("group_id", "permission_id");

-- CreateIndex
CREATE INDEX "auth_permission_content_type_id_2f476e4b" ON "auth_permission"("content_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_permission_content_type_id_codename_01ab375a_uniq" ON "auth_permission"("content_type_id", "codename");

-- CreateIndex
CREATE INDEX "django_admin_log_user_id_c564eba6" ON "django_admin_log"("user_id");

-- CreateIndex
CREATE INDEX "django_admin_log_content_type_id_c4bce8eb" ON "django_admin_log"("content_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_django_celery_beat_periodictask_1" ON "django_celery_beat_periodictask"("name");

-- CreateIndex
CREATE INDEX "django_celery_beat_periodictask_clocked_id_47a69f82" ON "django_celery_beat_periodictask"("clocked_id");

-- CreateIndex
CREATE INDEX "django_celery_beat_periodictask_solar_id_a87ce72c" ON "django_celery_beat_periodictask"("solar_id");

-- CreateIndex
CREATE INDEX "django_celery_beat_periodictask_interval_id_a8ca27da" ON "django_celery_beat_periodictask"("interval_id");

-- CreateIndex
CREATE INDEX "django_celery_beat_periodictask_crontab_id_d3cba168" ON "django_celery_beat_periodictask"("crontab_id");

-- CreateIndex
CREATE UNIQUE INDEX "celery_solarschedule_evt_lat_long_uniq" ON "django_celery_beat_solarschedule"("event", "latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "django_content_type_app_label_model_76bd3d3b_uniq" ON "django_content_type"("app_label", "model");

-- CreateIndex
CREATE INDEX "django_session_expire_date_a5c62663" ON "django_session"("expire_date");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_django_site_1" ON "django_site"("domain");

-- CreateIndex
CREATE INDEX "organizer_hackathon_organizer_id_1ad8afb1" ON "organizer_hackathon"("organizer_id");

-- CreateIndex
CREATE INDEX "organizer_hackathon_status_f6762e83" ON "organizer_hackathon"("status");

-- CreateIndex
CREATE INDEX "coord_h_u_active_idx" ON "organizer_hackathoncoordinator"("hackathon_id", "user_id", "is_active");

-- CreateIndex
CREATE INDEX "organizer_hackathoncoordinator_user_id_14c94e16" ON "organizer_hackathoncoordinator"("user_id");

-- CreateIndex
CREATE INDEX "organizer_hackathoncoordinator_hackathon_id_91aab097" ON "organizer_hackathoncoordinator"("hackathon_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizer_hackathoncoord_hid_uid_uniq" ON "organizer_hackathoncoordinator"("hackathon_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_organizer_organizerprofile_1" ON "organizer_organizerprofile"("user_id");

-- CreateIndex
CREATE INDEX "ps_hackathon_active_idx" ON "organizer_problemstatement"("hackathon_id", "is_active");

-- CreateIndex
CREATE INDEX "organizer_problemstatement_hackathon_id_e6dcb7ef" ON "organizer_problemstatement"("hackathon_id");

-- CreateIndex
CREATE INDEX "organizer_scancategory_hackathon_id_42a06835" ON "organizer_scancategory"("hackathon_id");

-- CreateIndex
CREATE INDEX "sc_h_active_idx" ON "organizer_scancategory"("hackathon_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "organizer_scancategory_hackathon_id_name_51d28d41_uniq" ON "organizer_scancategory"("hackathon_id", "name");

-- CreateIndex
CREATE INDEX "organizer_scanrecord_team_member_id_a8e60a9f" ON "organizer_scanrecord"("team_member_id");

-- CreateIndex
CREATE INDEX "organizer_scanrecord_scanned_by_id_0695c1b3" ON "organizer_scanrecord"("scanned_by_id");

-- CreateIndex
CREATE INDEX "organizer_scanrecord_scan_category_id_c0b6a1f7" ON "organizer_scanrecord"("scan_category_id");

-- CreateIndex
CREATE INDEX "sr_cat_member_idx" ON "organizer_scanrecord"("scan_category_id", "team_member_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizer_scanrecord_tmid_scid_uniq" ON "organizer_scanrecord"("team_member_id", "scan_category_id");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_participant_participantprofile_1" ON "participant_participantprofile"("user_id");

-- CreateIndex
CREATE INDEX "participant_participantprofile_skills_skill_id_23112aa7" ON "participant_participantprofile_skills"("skill_id");

-- CreateIndex
CREATE INDEX "participant_profile_skills_profile_id_idx" ON "participant_participantprofile_skills"("participantprofile_id");

-- CreateIndex
CREATE UNIQUE INDEX "participant_profile_skills_pid_sid_uniq" ON "participant_participantprofile_skills"("participantprofile_id", "skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_participant_payment_1" ON "participant_payment"("razorpay_order_id");

-- CreateIndex
CREATE INDEX "participant_payment_user_id_ef1454ef" ON "participant_payment"("user_id");

-- CreateIndex
CREATE INDEX "participant_payment_team_id_ad0a5385" ON "participant_payment"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_participant_skill_1" ON "participant_skill"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_participant_team_1" ON "participant_team"("qr_token");

-- CreateIndex
CREATE UNIQUE INDEX "participant_team_invite_token_uniq" ON "participant_team"("invite_token");

-- CreateIndex
CREATE INDEX "participant_team_selected_problem_statement_id_fcb5161f" ON "participant_team"("selected_problem_statement_id");

-- CreateIndex
CREATE INDEX "participant_team_leader_id_b8efbfb0" ON "participant_team"("leader_id");

-- CreateIndex
CREATE INDEX "participant_team_hackathon_id_35eb62c1" ON "participant_team"("hackathon_id");

-- CreateIndex
CREATE INDEX "participant_teammember_email_63a3b9c9" ON "participant_teammember"("email");

-- CreateIndex
CREATE INDEX "participant_teammember_team_id_299dc5d8" ON "participant_teammember"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "participant_teammember_team_id_email_fac64028_uniq" ON "participant_teammember"("team_id", "email");

-- CreateIndex
CREATE INDEX "participant_teammember_skills_skill_id_75e29140" ON "participant_teammember_skills"("skill_id");

-- CreateIndex
CREATE INDEX "participant_teammember_skills_teammember_id_99d26633" ON "participant_teammember_skills"("teammember_id");

-- CreateIndex
CREATE UNIQUE INDEX "participant_teammember_skills_tmid_sid_uniq" ON "participant_teammember_skills"("teammember_id", "skill_id");

-- CreateIndex
CREATE INDEX "participant_teamrequest_team_id_933d1ae5" ON "participant_teamrequest"("team_id");

-- CreateIndex
CREATE INDEX "participant_teamrequest_receiver_id_f5723ff6" ON "participant_teamrequest"("receiver_id");

-- CreateIndex
CREATE UNIQUE INDEX "participant_teamrequest_team_id_receiver_id_187fa2da_uniq" ON "participant_teamrequest"("team_id", "receiver_id");

-- CreateIndex
CREATE INDEX "socialaccount_socialaccount_user_id_8146e70c" ON "socialaccount_socialaccount"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "socialaccount_socialaccount_provider_uid_fc810c6e_uniq" ON "socialaccount_socialaccount"("provider", "uid");

-- CreateIndex
CREATE INDEX "socialaccount_socialapp_sites_site_id_2579dee5" ON "socialaccount_socialapp_sites"("site_id");

-- CreateIndex
CREATE INDEX "socialaccount_socialapp_sites_socialapp_id_97fb6e7d" ON "socialaccount_socialapp_sites"("socialapp_id");

-- CreateIndex
CREATE UNIQUE INDEX "socialaccount_socialapp_sites_appid_siteid_uniq" ON "socialaccount_socialapp_sites"("socialapp_id", "site_id");

-- CreateIndex
CREATE INDEX "socialaccount_socialtoken_app_id_636a42d7" ON "socialaccount_socialtoken"("app_id");

-- CreateIndex
CREATE INDEX "socialaccount_socialtoken_account_id_951f210e" ON "socialaccount_socialtoken"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "socialaccount_socialtoken_app_id_account_id_fca4e0ac_uniq" ON "socialaccount_socialtoken"("app_id", "account_id");

-- AddForeignKey
ALTER TABLE "account_emailaddress" ADD CONSTRAINT "account_emailaddress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "accounts_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "account_emailconfirmation" ADD CONSTRAINT "account_emailconfirmation_email_address_id_fkey" FOREIGN KEY ("email_address_id") REFERENCES "account_emailaddress"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "accounts_user_groups" ADD CONSTRAINT "accounts_user_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "auth_group"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "accounts_user_groups" ADD CONSTRAINT "accounts_user_groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "accounts_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "accounts_user_user_permissions" ADD CONSTRAINT "accounts_user_user_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "auth_permission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "accounts_user_user_permissions" ADD CONSTRAINT "accounts_user_user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "accounts_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auth_group_permissions" ADD CONSTRAINT "auth_group_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "auth_permission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auth_group_permissions" ADD CONSTRAINT "auth_group_permissions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "auth_group"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auth_permission" ADD CONSTRAINT "auth_permission_content_type_id_fkey" FOREIGN KEY ("content_type_id") REFERENCES "django_content_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "django_admin_log" ADD CONSTRAINT "django_admin_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "accounts_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "django_admin_log" ADD CONSTRAINT "django_admin_log_content_type_id_fkey" FOREIGN KEY ("content_type_id") REFERENCES "django_content_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "django_celery_beat_periodictask" ADD CONSTRAINT "django_celery_beat_periodictask_clocked_id_fkey" FOREIGN KEY ("clocked_id") REFERENCES "django_celery_beat_clockedschedule"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "django_celery_beat_periodictask" ADD CONSTRAINT "django_celery_beat_periodictask_solar_id_fkey" FOREIGN KEY ("solar_id") REFERENCES "django_celery_beat_solarschedule"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "django_celery_beat_periodictask" ADD CONSTRAINT "django_celery_beat_periodictask_interval_id_fkey" FOREIGN KEY ("interval_id") REFERENCES "django_celery_beat_intervalschedule"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "django_celery_beat_periodictask" ADD CONSTRAINT "django_celery_beat_periodictask_crontab_id_fkey" FOREIGN KEY ("crontab_id") REFERENCES "django_celery_beat_crontabschedule"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "organizer_hackathon" ADD CONSTRAINT "organizer_hackathon_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizer_organizerprofile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "organizer_hackathoncoordinator" ADD CONSTRAINT "organizer_hackathoncoordinator_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "accounts_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "organizer_hackathoncoordinator" ADD CONSTRAINT "organizer_hackathoncoordinator_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "organizer_hackathon"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "organizer_organizerprofile" ADD CONSTRAINT "organizer_organizerprofile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "accounts_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "organizer_problemstatement" ADD CONSTRAINT "organizer_problemstatement_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "organizer_hackathon"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "organizer_scancategory" ADD CONSTRAINT "organizer_scancategory_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "organizer_hackathon"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "organizer_scanrecord" ADD CONSTRAINT "organizer_scanrecord_team_member_id_fkey" FOREIGN KEY ("team_member_id") REFERENCES "participant_teammember"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "organizer_scanrecord" ADD CONSTRAINT "organizer_scanrecord_scanned_by_id_fkey" FOREIGN KEY ("scanned_by_id") REFERENCES "accounts_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "organizer_scanrecord" ADD CONSTRAINT "organizer_scanrecord_scan_category_id_fkey" FOREIGN KEY ("scan_category_id") REFERENCES "organizer_scancategory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "participant_participantprofile" ADD CONSTRAINT "participant_participantprofile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "accounts_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "participant_participantprofile_skills" ADD CONSTRAINT "participant_participantprofile_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "participant_skill"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "participant_participantprofile_skills" ADD CONSTRAINT "participant_participantprofile_skills_participantprofile_i_fkey" FOREIGN KEY ("participantprofile_id") REFERENCES "participant_participantprofile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "participant_payment" ADD CONSTRAINT "participant_payment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "accounts_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "participant_payment" ADD CONSTRAINT "participant_payment_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "participant_team"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "participant_team" ADD CONSTRAINT "participant_team_selected_problem_statement_id_fkey" FOREIGN KEY ("selected_problem_statement_id") REFERENCES "organizer_problemstatement"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "participant_team" ADD CONSTRAINT "participant_team_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "accounts_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "participant_team" ADD CONSTRAINT "participant_team_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "organizer_hackathon"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "participant_teammember" ADD CONSTRAINT "participant_teammember_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "participant_team"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "participant_teammember_skills" ADD CONSTRAINT "participant_teammember_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "participant_skill"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "participant_teammember_skills" ADD CONSTRAINT "participant_teammember_skills_teammember_id_fkey" FOREIGN KEY ("teammember_id") REFERENCES "participant_teammember"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "participant_teamrequest" ADD CONSTRAINT "participant_teamrequest_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "participant_team"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "participant_teamrequest" ADD CONSTRAINT "participant_teamrequest_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "accounts_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "socialaccount_socialaccount" ADD CONSTRAINT "socialaccount_socialaccount_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "accounts_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "socialaccount_socialapp_sites" ADD CONSTRAINT "socialaccount_socialapp_sites_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "django_site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "socialaccount_socialapp_sites" ADD CONSTRAINT "socialaccount_socialapp_sites_socialapp_id_fkey" FOREIGN KEY ("socialapp_id") REFERENCES "socialaccount_socialapp"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "socialaccount_socialtoken" ADD CONSTRAINT "socialaccount_socialtoken_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "socialaccount_socialapp"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "socialaccount_socialtoken" ADD CONSTRAINT "socialaccount_socialtoken_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "socialaccount_socialaccount"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
