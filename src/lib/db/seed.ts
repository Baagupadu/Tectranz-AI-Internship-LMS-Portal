import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { getDb, withTransaction } from './connection';
import { initSchema } from './schema';

export async function seedDatabase(): Promise<void> {
  initSchema();
  const db = getDb();

  // Check if already seeded
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount && userCount.count > 0) {
    return;
  }

  const defaultPasswordHash = await bcrypt.hash('tectranz123', 10);

  // Generate QR code base64 for demo certificate
  const demoCertId = 'TZ-CERT-2026-AIE-8921';
  const demoVerificationToken = 'vt_demo_9876543210_tectranz';
  const qrDataUrl = await QRCode.toDataURL(
    `https://aiintern.tectranz.com/verify/${demoCertId}?token=${demoVerificationToken}`,
    { width: 256, margin: 1 }
  );

  withTransaction((database) => {
    // 1. Partner Organizations
    database.exec(`
      INSERT INTO partner_organizations (id, name, industry, website, contact_email, status) VALUES
      (1, 'Aethelgard AI Labs', 'Enterprise LLM Infrastructure', 'https://aethelgard.ai', 'partners@aethelgard.ai', 'active'),
      (2, 'Cognitiq Robotics', 'Autonomous Systems & Edge Vision', 'https://cognitiq.io', 'internships@cognitiq.io', 'active'),
      (3, 'HyperScale Dataworks', 'Real-time AI Feature Pipelines', 'https://hyperscaledata.com', 'talent@hyperscaledata.com', 'active'),
      (4, 'NeuralDefense Cyber', 'Adversarial AI & Red Teaming', 'https://neuraldefense.security', 'research@neuraldefense.security', 'active');
    `);

    // 2. Tracks (L1 to L6)
    database.exec(`
      INSERT INTO tracks (id, slug, code, name, description, duration_weeks) VALUES
      (1, 'genai-llm', 'L1', 'GenAI & LLM Application Engineering', 'Build production systems around foundation models: multi-agent architectures, enterprise RAG, streaming pipelines, evaluation harnesses, and secure deployment.', 16),
      (2, 'mlops-infra', 'L2', 'MLOps & AI Infrastructure Engineering', 'Scale ML workloads from training to high-throughput inference: model registries, Kubernetes orchestration, Ray clusters, and drift monitoring.', 16),
      (3, 'data-eng', 'L3', 'Data Engineering for AI Systems', 'Architect distributed data engines, streaming pipelines (Kafka, Flink), vector stores, and automated synthetic data pipelines for model ingestion.', 16),
      (4, 'research-ds', 'L4', 'AI/ML Research & Data Science', 'Deep learning formulation, transformer architectures from scratch, diffusion modeling, statistical validation, and academic publishing rigor.', 16),
      (5, 'ai-security', 'L5', 'AI Security & Red Teaming', 'Jailbreak auditing, prompt injection mitigations, training data poisoning defense, model extraction prevention, and compliance audits.', 16),
      (6, 'comp-vision', 'L6', 'Computer Vision Engineering', 'Real-time object detection (YOLOv10), multi-camera multi-target tracking, 3D perception, NeRFs, and edge quantization for embedded robotics.', 16);
    `);

    // 3. Plans
    database.exec(`
      INSERT INTO plans (id, slug, name, price_inr, mode, description, weekly_hours, includes_office_access) VALUES
      (1, 'starter', 'Starter Online', 1999, 'online', 'Foundations curriculum, recorded masterclasses, guided labs, community support, and verified completion.', 10, 0),
      (2, 'professional', 'Professional Track', 4999, 'online', 'Full 16-week curriculum, live mentor workshops, weekly code reviews, 1 minor project, and QR-verifiable certificate.', 15, 0),
      (3, 'industry', 'Industry Capstone', 9999, 'hybrid', 'Real partner capstone problem, dual-mentor code audits, defended viva review, mock interviews, and company offer letter.', 20, 1),
      (4, 'hybrid-campus', 'Hybrid Campus 4.1', 12999, 'hybrid', 'Tailored for 4.1 students: 2 in-office lab days per week, live company standups, UGC/AICTE credit documentation.', 25, 1),
      (5, 'immersive', 'Immersive Office 4.2', 15999, 'in-office', 'Full-time 5 days/week in-office project semester. Work side-by-side with partner engineers on live production codebases.', 40, 1);
    `);

    // 4. Policy Versions
    database.exec(`
      INSERT INTO policy_versions (id, version_tag, name, min_attendance_percent, min_engagement_hours, required_projects_count, required_reports_count, passing_grade_percent, late_penalty_per_day, resubmission_allowed, is_default) VALUES
      (1, 'v2026.1', '2026 Master Policy (Standard 16-Week)', 75.0, 120.0, 2, 4, 60.0, 5.0, 1, 1),
      (2, 'v2026.accelerated', '2026 Fast-Track Policy (8-Week)', 85.0, 80.0, 1, 2, 70.0, 10.0, 1, 0);
    `);

    // 5. Users
    const insertUser = database.prepare(`
      INSERT INTO users (id, email, password_hash, role, mfa_enabled, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `);

    insertUser.run(1, 'student@tectranz.com', defaultPasswordHash, 'student', 0);
    insertUser.run(2, 'riya.verma@tectranz.com', defaultPasswordHash, 'student', 0);
    insertUser.run(3, 'mentor@tectranz.com', defaultPasswordHash, 'mentor', 1);
    insertUser.run(4, 'admin@tectranz.com', defaultPasswordHash, 'admin', 1);
    insertUser.run(5, 'reviewer@tectranz.com', defaultPasswordHash, 'reviewer', 0);
    insertUser.run(6, 'supervisor@tectranz.com', defaultPasswordHash, 'supervisor', 0);
    insertUser.run(7, 'finance@tectranz.com', defaultPasswordHash, 'finance', 1);

    // 6. Profiles
    database.exec(`
      INSERT INTO student_profiles (user_id, full_name, phone, college_name, graduation_year, semester, degree_branch, github_url, linkedin_url, timezone, consent_signed_at) VALUES
      (1, 'Aarav Sharma', '+91 98765 43210', 'Vellore Institute of Technology (VIT)', 2026, '4.1', 'Computer Science & Engineering', 'https://github.com/aarav-sharma-ai', 'https://linkedin.com/in/aaravsharma-tectranz', 'Asia/Kolkata', datetime('now', '-30 days')),
      (2, 'Riya Verma', '+91 98123 45678', 'BITS Pilani, Hyderabad Campus', 2026, '4.2', 'Artificial Intelligence & Robotics', 'https://github.com/riyaverma-cv', 'https://linkedin.com/in/riyaverma-ai', 'Asia/Kolkata', datetime('now', '-90 days'));

      INSERT INTO mentor_profiles (user_id, full_name, headline, bio, company, expertise_tracks, max_students) VALUES
      (3, 'Dr. Vikramaditya Sen', 'Principal AI Systems Architect', '14+ years building distributed AI pipelines, LLM retrieval systems, and serving low-latency generative models in production.', 'Tectranz Research Labs', 'L1, L2, L5', 25);
    `);

    // 7. Cohorts
    database.exec(`
      INSERT INTO cohorts (id, track_id, policy_version_id, name, start_date, end_date, lead_mentor_id, max_capacity, status) VALUES
      (1, 1, 1, 'COHORT-2026-NOV-L1', '2026-10-01', '2027-01-22', 3, 40, 'in_progress'),
      (2, 6, 1, 'COHORT-2026-AUG-L6', '2026-07-01', '2026-10-20', 3, 30, 'completed');
    `);

    // 8. Enrolments
    database.exec(`
      INSERT INTO enrolments (id, registration_id, user_id, cohort_id, plan_id, policy_version_id, partner_id, assigned_mentor_id, status, payment_status, onboarding_completed, created_at) VALUES
      (1, 'TZ-2026-AIE-0418', 1, 1, 3, 1, 1, 3, 'active', 'paid', 1, datetime('now', '-28 days')),
      (2, 'TZ-2026-CVE-0102', 2, 2, 5, 1, 2, 3, 'completed', 'paid', 1, datetime('now', '-100 days'));
    `);

    // 9. Payments
    database.exec(`
      INSERT INTO payments (order_id, transaction_ref, user_id, enrolment_id, plan_id, amount_inr, currency, provider, status, verified_at, created_at) VALUES
      ('order_TZ_live_89128', 'pay_rzp_98120398', 1, 1, 3, 9999, 'INR', 'razorpay', 'successful', datetime('now', '-28 days'), datetime('now', '-28 days')),
      ('order_TZ_live_77121', 'pay_rzp_66129841', 2, 2, 5, 15999, 'INR', 'razorpay', 'successful', datetime('now', '-100 days'), datetime('now', '-100 days'));
    `);

    // 10. Curriculum for L1 (GenAI & LLM)
    database.exec(`
      INSERT INTO curriculum_phases (id, track_id, phase_number, title, description, start_week, end_week) VALUES
      (1, 1, 1, 'Train: AI Engineering Foundations', 'Core LLM APIs, function calling, structured outputs, prompt engineering, and streaming servers.', 1, 2),
      (2, 1, 2, 'Build: Advanced RAG & Vector Systems', 'Hybrid search, BM25 + dense embeddings, rerankers, semantic routing, and vector index tuning.', 3, 6),
      (3, 1, 3, 'Build: Multi-Agent Systems & Tool Orchestration', 'Autonomous workflows, LangGraph/CrewAI architectures, memory state persistence, and guardrails.', 7, 10),
      (4, 1, 4, 'Build: Evaluation, Fine-Tuning & MLOps', 'LLM-as-judge, RAGAS metrics, LoRA fine-tuning, latency optimization, and vLLM deployment.', 11, 14),
      (5, 1, 5, 'Review & Launch: Partner Capstone Defense', 'Partner company capstone delivery, code reviews with partner engineers, viva, and certificate issuance.', 15, 16);

      INSERT INTO curriculum_modules (id, phase_id, module_number, title, description, week_number) VALUES
      (1, 1, 1, 'Module 01: Modern LLM APIs & Structured Generation', 'Pydantic schemas, instructor, JSON modes, and token economics.', 1),
      (2, 1, 2, 'Module 02: Streaming Architectures & SSE Protocol', 'FastAPI, async generators, backpressure, and WebSocket fallbacks.', 2),
      (3, 2, 3, 'Module 03: Chunking Strategies & Vector Embeddings', 'Semantic chunking, recursive splitters, embedding benchmarks, and HNSW indexes.', 3),
      (4, 2, 4, 'Module 04: Hybrid Retrieval & Cross-Encoder Reranking', 'Reciprocal Rank Fusion, Cohere/BGE rerankers, and retrieval latency tuning.', 4);

      INSERT INTO curriculum_lessons (id, module_id, title, lesson_type, duration_minutes, video_url, transcript_text, resources_json, order_index) VALUES
      (1, 1, 'Understanding Frontier LLM Architectures & Context Windows', 'recorded', 45, 'https://cdn.tectranz.com/streams/l1-m1-01.mp4', 'Welcome to Tectranz AI Engineering. In this lesson we unpack the mechanics of decoder-only transformers...', '{"slidesUrl":"https://cdn.tectranz.com/slides/l1-m1-01.pdf","codeRepo":"https://github.com/tectranz-interns/l1-structured-gen"}', 1),
      (2, 1, 'Zero-Shot Structured Extraction with Pydantic & Instructor', 'recorded', 50, 'https://cdn.tectranz.com/streams/l1-m1-02.mp4', 'Deterministic outputs from probabilistic models are the foundation of reliable AI systems...', '{"notebookUrl":"https://colab.research.google.com/drive/tectranz-pydantic"}', 2),
      (3, 1, 'Hands-on Lab: Building an Audit Extraction Agent', 'practical_lab', 90, null, null, '{"instructions":"Implement extraction pipeline for financial disclosure statements."}', 3),
      (4, 2, 'Streaming Server-Sent Events with FastAPI and React Client', 'recorded', 60, 'https://cdn.tectranz.com/streams/l1-m2-01.mp4', 'Streaming tokens improves perceived latency by 90%...', '{"sampleRepo":"https://github.com/tectranz-interns/sse-fastapi"}', 1),
      (5, 3, 'Deep Dive: Chunk Size Trade-offs in Technical Manuals', 'recorded', 55, 'https://cdn.tectranz.com/streams/l1-m3-01.mp4', 'Naïve 512-token chunks often split crucial tables. Let us study hierarchical chunking...', '{"benchmarks":"https://cdn.tectranz.com/data/chunk-eval.csv"}', 1);

      -- Record student 1 lesson progress
      INSERT INTO lesson_completions (enrolment_id, lesson_id, status, progress_seconds, completion_evidence, completed_at) VALUES
      (1, 1, 'completed', 2700, 'Watched 100% and submitted check quiz', datetime('now', '-24 days')),
      (1, 2, 'completed', 3000, 'Completed practical exercise with full assertions passing', datetime('now', '-20 days')),
      (1, 3, 'completed', 5400, 'GitHub commit hash: c8f7129a', datetime('now', '-16 days')),
      (1, 4, 'completed', 3600, 'Watched video and deployed SSE demo', datetime('now', '-10 days')),
      (1, 5, 'in_progress', 1800, null, datetime('now', '-2 days'));
    `);

    // 11. Live Sessions & Attendance
    database.exec(`
      INSERT INTO live_sessions (id, cohort_id, title, session_type, instructor_id, scheduled_start, scheduled_end, timezone, meeting_link, is_required, status, recording_url) VALUES
      (1, 1, 'Cohort Onboarding & Enterprise Architecture Setup', 'lecture', 3, datetime('now', '-26 days', '18:00'), datetime('now', '-26 days', '19:30'), 'Asia/Kolkata', 'https://meet.tectranz.com/l1-nov-01', 1, 'completed', 'https://cdn.tectranz.com/recordings/l1-nov-01.mp4'),
      (2, 1, 'Live Code Lab: RAG Retrieval Tuning & Vector Indexing', 'lecture', 3, datetime('now', '-19 days', '18:00'), datetime('now', '-19 days', '19:30'), 'Asia/Kolkata', 'https://meet.tectranz.com/l1-nov-02', 1, 'completed', 'https://cdn.tectranz.com/recordings/l1-nov-02.mp4'),
      (3, 1, 'Mentor Office Hours: Debugging Semantic Search Failures', 'office_hours', 3, datetime('now', '-12 days', '17:00'), datetime('now', '-18 days', '18:00'), 'Asia/Kolkata', 'https://meet.tectranz.com/l1-nov-oh1', 0, 'completed', 'https://cdn.tectranz.com/recordings/l1-nov-oh1.mp4'),
      (4, 1, 'Live Session: Multi-Agent Collaboration Patterns with LangGraph', 'lecture', 3, datetime('now', '+2 days', '18:00'), datetime('now', '+2 days', '19:30'), 'Asia/Kolkata', 'https://meet.tectranz.com/l1-nov-04', 1, 'scheduled', null),
      (5, 1, 'Partner Review & Technical Milestone 1 Check-in', 'review', 3, datetime('now', '+7 days', '19:00'), datetime('now', '+7 days', '20:30'), 'Asia/Kolkata', 'https://meet.tectranz.com/l1-nov-rev1', 1, 'scheduled', null);

      INSERT INTO attendance_records (enrolment_id, live_session_id, status, verified_by_id, notes, marked_at) VALUES
      (1, 1, 'present', 3, 'Active in chat, completed terminal setup check.', datetime('now', '-26 days')),
      (1, 2, 'present', 3, 'Demoed local Qdrant container and query latency test.', datetime('now', '-19 days')),
      (1, 3, 'present', 3, 'Asked questions regarding dense vs sparse re-ranking.', datetime('now', '-12 days'));
    `);

    // 12. Assignments & Submissions
    database.exec(`
      INSERT INTO assignments (id, cohort_id, title, description, instructions, rubric_json, max_points, due_date, late_allowed, order_index) VALUES
      (1, 1, 'Assignment 01: Pydantic Schema Extraction Pipeline', 'Implement an extraction pipeline that transforms unformatted PDF technical specs into validated JSON schemas.', 'Fork the starter repository, implement the extract_specs() pipeline, and run all 18 test cases.', '{"correctness": 40, "code_cleanliness": 20, "error_handling": 20, "documentation": 20}', 100, datetime('now', '-18 days'), 1, 1),
      (2, 1, 'Assignment 02: Hybrid Semantic Retrieval Benchmark', 'Build a retrieval pipeline comparing Dense Embeddings vs BM25 vs Reciprocal Rank Fusion on the TechDocs corpus.', 'Benchmark retrieval Recall@5 and NDCG@10 across 100 complex queries. Provide report with latency vs precision tradeoff curves.', '{"benchmark_rigor": 35, "retrieval_performance": 35, "code_structure": 15, "report_analysis": 15}', 100, datetime('now', '-4 days'), 1, 2),
      (3, 1, 'Assignment 03: Fault-Tolerant LangGraph Agent', 'Construct a stateful agent with human-in-the-loop interruption, retry checkpoints, and database tools.', 'Implement SQLite state persistence and simulate tool API failures.', '{"state_persistence": 30, "hitl_implementation": 30, "error_resilience": 20, "unit_tests": 20}', 100, datetime('now', '+10 days'), 1, 3);

      INSERT INTO assignment_submissions (assignment_id, enrolment_id, version_number, github_repo_url, demo_url, submission_text, status, score, reviewer_id, reviewer_feedback, submitted_at, graded_at) VALUES
      (1, 1, 1, 'https://github.com/aarav-sharma-ai/tectranz-assignment-01', 'https://aarav-specs.fly.dev', 'Completed extraction engine with 100% test coverage across edge cases including partial tables and nested arrays.', 'graded', 96.0, 3, 'Exceptional attention to edge-case schemas. Clean Pydantic v2 validator usage and comprehensive error loggers. Approved for Phase 2.', datetime('now', '-19 days'), datetime('now', '-17 days')),
      (2, 1, 1, 'https://github.com/aarav-sharma-ai/tectranz-assignment-02', 'https://aarav-rag-bench.streamlit.app', 'Implemented hybrid retrieval with Qdrant + BM25 and Cohere Re-ranker. NDCG@10 reached 0.887 on technical queries.', 'under_review', null, 3, null, datetime('now', '-3 days'), null);
    `);

    // 13. Project Catalogue
    database.exec(`
      INSERT INTO project_catalogue (id, track_id, title, difficulty, partner_id, problem_statement, scope_details, deliverables_json, reviewer_capacity) VALUES
      (1, 1, 'Enterprise Financial Disclosures Agent & Regulatory Verifier', 'advanced', 1, 'Financial institutions struggle to audit 300+ page SEC filings against complex ESG and solvency regulations without hallucination risks.', 'Design a citation-enforced RAG and agentic auditing system that references exact paragraph coordinates in source PDFs with zero ungrounded claims.', '["Architecture Diagram", "FastAPI Retrieval Service", "React Audit Workbench", "Evaluation Benchmark Suite (>98% Groundedness)"]', 8),
      (2, 1, 'Autonomous Customer Support Copilot with State Graphs', 'intermediate', 1, 'E-commerce platform requires contextual multi-turn resolution with automated order modification and CRM sync.', 'Implement a LangGraph agent that handles return policies, payment issues, and human agent escalations.', '["State Graph Definition", "Mock CRM Integration", "Unit & Integration Tests"]', 10),
      (3, 6, 'Edge Perception & Multi-Camera Vehicle Tracker', 'advanced', 2, 'Autonomous delivery rovers require real-time 30FPS obstacle tracking under varying daylight and rain conditions.', 'Deploy quantized YOLOv10 and ByteTrack models on NVIDIA Jetson Orin with TensorRT optimization.', '["TensorRT Engine", "Tracking Benchmark Report", "ROS2 Node Implementation"]', 6);

      -- Student 1 active Capstone project
      INSERT INTO student_projects (id, enrolment_id, catalogue_project_id, title, project_type, partner_id, mentor_id, status, repo_url, demo_url, documentation_url, viva_status, viva_score, approved_at) VALUES
      (1, 1, 1, 'Enterprise Financial Disclosures Agent & Regulatory Verifier', 'capstone', 1, 3, 'in_progress', 'https://github.com/aarav-sharma-ai/enterprise-regulatory-rag', 'https://fin-audit.tectranz.dev', 'https://docs.fin-audit.tectranz.dev', 'pending', null, datetime('now', '-14 days'));

      INSERT INTO project_milestones (student_project_id, milestone_number, title, due_date, status, feedback) VALUES
      (1, 1, 'Milestone 01: PDF Parsing Engine & Coordinate Mapping', datetime('now', '-10 days'), 'completed', 'Passed rubric review with 98% OCR bounding box accuracy.'),
      (1, 2, 'Milestone 02: Hybrid Vector Index & Citation Pipeline', datetime('now', '+5 days'), 'in_review', 'Pull request submitted for partner review.'),
      (1, 3, 'Milestone 03: Agentic Auditing Logic & Hallucination Guardrail', datetime('now', '+20 days'), 'pending', null),
      (1, 4, 'Milestone 04: Production Deployment & Partner Technical Viva', datetime('now', '+40 days'), 'pending', null);

      -- Student 2 completed project
      INSERT INTO student_projects (id, enrolment_id, catalogue_project_id, title, project_type, partner_id, mentor_id, status, repo_url, demo_url, documentation_url, viva_status, viva_score, approved_at) VALUES
      (2, 2, 3, 'Edge Perception & Multi-Camera Vehicle Tracker', 'capstone', 2, 3, 'accepted', 'https://github.com/riyaverma-cv/jetson-perception-ros2', 'https://demo-cv.cognitiq.io', 'https://riya-docs.cognitiq.io', 'passed', 98.5, datetime('now', '-10 days'));
    `);

    // 14. Activity Logbook & Periodic Reports
    database.exec(`
      INSERT INTO activity_logbook (enrolment_id, log_date, activity_category, duration_minutes, learning_outcome, blockers, evidence_url, status, approved_by_id, approved_at) VALUES
      (1, '2026-10-05', 'learning', 180, 'Mastered token counting, tiktoken library, and JSON schema constraints with Claude 3.5 Sonnet.', 'Minor rate-limiting issues resolved using exponential backoff.', 'https://github.com/aarav-sharma-ai/logs/day1.md', 'approved', 3, datetime('now', '-23 days')),
      (1, '2026-10-12', 'coding', 240, 'Built asynchronous PDF page renderer using PyMuPDF and extracted bounding boxes for every paragraph.', 'None.', 'https://github.com/aarav-sharma-ai/enterprise-regulatory-rag/commit/b821a', 'approved', 3, datetime('now', '-16 days')),
      (1, '2026-10-19', 'debugging', 210, 'Benchmarked HNSW M and efConstruction parameters in Qdrant. Settled on M=32 for sub-15ms p99 latency.', 'Memory spike during large batch uploads resolved via chunked streaming.', 'https://github.com/aarav-sharma-ai/enterprise-regulatory-rag/commit/c9120', 'approved', 3, datetime('now', '-9 days')),
      (1, '2026-10-26', 'project_work', 260, 'Integrated Cohere Re-ranker v3 and implemented citation generation with paragraph coordinate bounding boxes.', 'Need mentor guidance on handling multiline tables spanning across 3 pages.', 'https://github.com/aarav-sharma-ai/enterprise-regulatory-rag/pull/4', 'submitted', null, null);

      INSERT INTO periodic_reports (id, enrolment_id, report_type, period_start, period_end, summary_text, challenges_text, planned_next_text, metrics_snapshot_json, mentor_feedback, status, approved_by_id, approved_at) VALUES
      (1, 1, 'fortnightly', '2026-10-01', '2026-10-15', 'Completed Phase 1 curriculum and initiated PDF ingestion engine for capstone. Implemented initial schemas and benchmarked vector databases.', 'Table structure preservation in complex multi-column financial PDFs required custom layout detection.', 'Finalize hybrid retrieval pipeline with BM25 + Qdrant and prepare Milestone 2 pull request.', '{"attendance_rate": 100, "approved_hours": 32, "assignments_graded": 1, "average_score": 96}', 'Strong momentum Aarav. The extraction accuracy you achieved on 10-K filings exceeded cohort average. Keep up the disciplined logbook updates.', 'approved', 3, datetime('now', '-13 days'));
    `);

    // 15. Certificates & Verification
    database.exec(`
      INSERT INTO certificates (id, certificate_id, enrolment_id, recipient_name, track_name, partner_name, issue_date, completion_grade, total_hours_completed, status, qr_code_data, public_verification_token) VALUES
      (1, '${demoCertId}', 2, 'Riya Verma', 'Computer Vision Engineering', 'Cognitiq Robotics', '2026-10-22', 'Grade A+ (Distinction)', 480.0, 'issued', '${qrDataUrl}', '${demoVerificationToken}');
    `);

    // 16. Documents
    database.exec(`
      INSERT INTO documents (enrolment_id, doc_type, title, file_path, file_size_bytes, mime_type) VALUES
      (1, 'receipt', 'Official Fee Tax Invoice - TZ-INV-2026-0418', '/documents/invoices/TZ-INV-2026-0418.pdf', 142800, 'application/pdf'),
      (1, 'enrolment_letter', 'Formal Programme Enrolment Letter & Academic Schedule', '/documents/enrolment/TZ-ENR-2026-0418.pdf', 214500, 'application/pdf'),
      (1, 'partner_offer', 'Aethelgard AI Labs - Project Placement & Internship Letter', '/documents/offers/TZ-OFFER-AETHELGARD-0418.pdf', 312000, 'application/pdf'),
      (2, 'completion_certificate', 'Official Certificate of Completion & Industry Verification', '/documents/certs/${demoCertId}.pdf', 524000, 'application/pdf');
    `);

    // 17. Support Tickets
    database.exec(`
      INSERT INTO support_tickets (id, user_id, enrolment_id, category, subject, priority, status) VALUES
      (1, 1, 1, 'academic', 'Guidance on multi-page table extraction across SEC 10-K disclosures', 'medium', 'in_progress'),
      (2, 1, 1, 'attendance', 'Attendance verification for Session 3 Office Hours', 'low', 'resolved');

      INSERT INTO support_messages (ticket_id, sender_id, message) VALUES
      (1, 1, 'Hi Mentor, in my Capstone, some financial tables span 3 consecutive pages without headers on pages 2 and 3. How should we configure the markdown chunker?'),
      (1, 3, 'Great question Aarav. Check out the TableTransformer utility in the repo resources. We will review this in the upcoming live standup.'),
      (2, 1, 'My attendance for the Friday office hours was marked as pending verification.'),
      (2, 4, 'Resolved! Verified your participation record and updated your status to present.');
    `);

    // 18. Notifications
    database.exec(`
      INSERT INTO notifications (user_id, title, message, notification_type, read_status, action_url) VALUES
      (1, 'Milestone 1 Feedback Released', 'Dr. Vikramaditya Sen approved your Capstone Milestone 1 submission with distinction remarks.', 'feedback', 0, '/student/projects'),
      (1, 'Upcoming Live Class', 'Live Session: Multi-Agent Collaboration Patterns with LangGraph scheduled for Thursday at 6:00 PM IST.', 'session', 0, '/student/calendar'),
      (1, 'Assignment 02 Under Review', 'Your submission for Assignment 02: Hybrid Semantic Retrieval Benchmark is currently being graded.', 'info', 1, '/student/tasks');
    `);

    // 19. Background Jobs
    database.exec(`
      INSERT INTO background_jobs (job_type, payload_json, status, retries, completed_at) VALUES
      ('email_enrolment_welcome', '{"user_id": 1, "email": "student@tectranz.com", "reg_id": "TZ-2026-AIE-0418"}', 'completed', 0, datetime('now', '-28 days')),
      ('generate_pdf_report', '{"report_id": 1, "enrolment_id": 1}', 'completed', 0, datetime('now', '-13 days')),
      ('deliver_certificate_email', '{"certificate_id": "${demoCertId}", "email": "riya.verma@tectranz.com"}', 'completed', 0, datetime('now', '-6 days'));
    `);

    // 20. Audit Logs
    database.exec(`
      INSERT INTO audit_logs (actor_user_id, action, resource_type, resource_id, metadata_json, ip_address) VALUES
      (4, 'SYSTEM_BOOTSTRAP', 'SYSTEM', '1', '{"event": "Database schema created and seeded with v2026.1 master curriculum"}', '127.0.0.1'),
      (4, 'ENROLMENT_ACTIVATED', 'enrolments', '1', '{"reg_id": "TZ-2026-AIE-0418", "plan": "industry"}', '127.0.0.1');
    `);
  });
}
