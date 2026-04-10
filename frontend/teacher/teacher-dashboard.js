document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');

    if (!token || role !== 'teacher') {
        window.location.href = '../index.html';
        return;
    }

    const STORAGE_KEY = 'studyhub.teacher.portal.v1';

    const formatISODate = (date) => date.toISOString().split('T')[0];
    const formatDisplayDate = (iso) => {
        if (!iso) return '--';
        const date = new Date(iso);
        if (Number.isNaN(date.getTime())) return iso;
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const daysAgo = (offset) => {
        const date = new Date();
        date.setDate(date.getDate() - offset);
        return formatISODate(date);
    };

    const buildDefaultData = () => {
        const today = formatISODate(new Date());
        const students = [
            {
                id: 'stu-1001',
                name: 'Aarav Mehta',
                grade: 'Grade 10 - A',
                email: 'aarav@studyhub.ai',
                phone: '9000000001',
                parent: {
                    name: 'Rohit Mehta',
                    relation: 'Father',
                    phone: '9000001001',
                    email: 'rohit.mehta@example.com',
                    address: 'Block A, River Lane',
                    emergency: '9000002222'
                },
                achievements: [
                    { id: 'ach-1', title: 'Math Olympiad Bronze', date: '2025-12-12', note: 'Regional round' },
                    { id: 'ach-2', title: 'Perfect Attendance', date: '2025-11-20', note: 'Semester 1' }
                ],
                progress: {
                    rating: 4,
                    ups: 'Strong problem solving and steady homework pace.',
                    downs: 'Needs more confidence in presentations.'
                }
            },
            {
                id: 'stu-1002',
                name: 'Mira Kapoor',
                grade: 'Grade 10 - A',
                email: 'mira@studyhub.ai',
                phone: '9000000002',
                parent: {
                    name: 'Neha Kapoor',
                    relation: 'Mother',
                    phone: '9000001002',
                    email: 'neha.kapoor@example.com',
                    address: 'Lakeview Towers',
                    emergency: '9000003333'
                },
                achievements: [
                    { id: 'ach-3', title: 'Science Fair Winner', date: '2025-10-08', note: 'State level' }
                ],
                progress: {
                    rating: 5,
                    ups: 'Excellent research skills and class participation.',
                    downs: 'Balance group workload during projects.'
                }
            },
            {
                id: 'stu-1003',
                name: 'Zayan Ali',
                grade: 'Grade 10 - B',
                email: 'zayan@studyhub.ai',
                phone: '9000000003',
                parent: {
                    name: 'Farah Ali',
                    relation: 'Guardian',
                    phone: '9000001003',
                    email: 'farah.ali@example.com',
                    address: 'Hillcrest Residency',
                    emergency: '9000004444'
                },
                achievements: [
                    { id: 'ach-4', title: 'Debate Finalist', date: '2025-09-14', note: 'Inter-school' }
                ],
                progress: {
                    rating: 3,
                    ups: 'Creative thinking and teamwork.',
                    downs: 'Needs consistent homework submission.'
                }
            },
            {
                id: 'stu-1004',
                name: 'Nisha Roy',
                grade: 'Grade 9 - A',
                email: 'nisha@studyhub.ai',
                phone: '9000000004',
                parent: {
                    name: 'Sanjay Roy',
                    relation: 'Father',
                    phone: '9000001004',
                    email: 'sanjay.roy@example.com',
                    address: 'Maple Residency',
                    emergency: '9000005555'
                },
                achievements: [
                    { id: 'ach-5', title: 'Creative Writing Award', date: '2025-08-30', note: 'District level' }
                ],
                progress: {
                    rating: 4,
                    ups: 'Excellent language skills.',
                    downs: 'Needs more practice in math drills.'
                }
            }
        ];

        const attendance = {
            date: today,
            records: {}
        };
        students.forEach((student) => {
            attendance.records[student.id] = { status: 'Present' };
        });

        const teacherAttendance = [
            { date: daysAgo(0), status: 'Present', inTime: '08:05', outTime: '15:15' },
            { date: daysAgo(1), status: 'Present', inTime: '08:00', outTime: '15:05' },
            { date: daysAgo(2), status: 'Late', inTime: '08:20', outTime: '15:00' },
            { date: daysAgo(3), status: 'Present', inTime: '08:08', outTime: '15:12' },
            { date: daysAgo(4), status: 'Present', inTime: '08:03', outTime: '15:18' }
        ];

        return {
            teacherProfile: {
                name: 'Priya Sharma',
                email: 'priya.sharma@studyhub.ai',
                subject: 'Mathematics',
                phone: '9000007777',
                bio: 'Focused on building problem-solving habits and steady progress.'
            },
            students,
            messages: [
                {
                    id: 'msg-1',
                    studentId: 'stu-1001',
                    studentName: 'Aarav Mehta',
                    subject: 'Quiz follow-up',
                    body: 'Please revise chapter 3 and meet during office hours if needed.',
                    timestamp: new Date().toISOString()
                }
            ],
            assignments: [
                {
                    id: 'asg-1',
                    title: 'Algebra Practice Set 5',
                    type: 'Homework',
                    studentId: 'all',
                    dueDate: daysAgo(-3),
                    details: 'Complete questions 1 to 20.',
                    status: 'Assigned'
                },
                {
                    id: 'asg-2',
                    title: 'Science Lab Notes',
                    type: 'Assignment',
                    studentId: 'stu-1002',
                    dueDate: daysAgo(-1),
                    details: 'Submit lab notes for the diffusion experiment.',
                    status: 'Assigned'
                }
            ],
            attendance,
            teacherAttendance,
            grades: [
                { id: 'g-1', studentId: 'stu-1001', subject: 'Mathematics', examName: 'Mid-Term', score: 88, maxScore: 100, date: daysAgo(7), remark: 'Excellent performance.' },
                { id: 'g-2', studentId: 'stu-1002', subject: 'Mathematics', examName: 'Mid-Term', score: 94, maxScore: 100, date: daysAgo(7), remark: 'Outstanding!' },
                { id: 'g-3', studentId: 'stu-1003', subject: 'Mathematics', examName: 'Mid-Term', score: 72, maxScore: 100, date: daysAgo(7), remark: 'Needs improvement in algebra.' },
                { id: 'g-4', studentId: 'stu-1004', subject: 'Mathematics', examName: 'Mid-Term', score: 81, maxScore: 100, date: daysAgo(7), remark: 'Good progress.' }
            ],
            announcements: [
                {
                    id: 'ann-1',
                    title: 'Welcome to the new semester!',
                    body: 'Please submit all pending assignments by end of this week.',
                    priority: 'info',
                    timestamp: new Date().toISOString()
                }
            ]
        };
    };

    const loadData = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                const fresh = buildDefaultData();
                localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
                return fresh;
            }
            const parsed = JSON.parse(raw);
            if (!parsed || !Array.isArray(parsed.students)) {
                const fresh = buildDefaultData();
                localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
                return fresh;
            }
            return parsed;
        } catch (error) {
            const fresh = buildDefaultData();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
            return fresh;
        }
    };

    const saveData = (data) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    };

    const ensureTodayAttendance = (data) => {
        const today = formatISODate(new Date());
        if (!data.attendance || data.attendance.date !== today) {
            const records = {};
            data.students.forEach((student) => {
                records[student.id] = { status: 'Unmarked' };
            });
            data.attendance = { date: today, records };
        }
    };

    const getNameFromToken = (tokenValue) => {
        try {
            const payloadPart = tokenValue.split('.')[1];
            if (!payloadPart) return 'Teacher';
            const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
            const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
            const decoded = atob(padded);
            const payload = JSON.parse(decoded);
            const email = payload.sub || '';
            return email ? email.split('@')[0] : 'Teacher';
        } catch (error) {
            return 'Teacher';
        }
    };

    const viewTitles = {
        overview: {
            title: 'Teacher Overview',
            subtitle: 'Track the class and manage student progress.'
        },
        communication: {
            title: 'Communication',
            subtitle: 'Send updates and guidance to students.'
        },
        records: {
            title: 'Student Records',
            subtitle: 'Manage profiles, parent details, and achievements.'
        },
        performance: {
            title: 'Student Progress',
            subtitle: 'Record ups and downs for each student.'
        },
        grades: {
            title: '🎓 Grades',
            subtitle: 'Record and manage subject-wise grades for each student.'
        },
        assignments: {
            title: 'Assignments',
            subtitle: 'Create tasks, homework, and project work.'
        },
        announcements: {
            title: '📢 Announcements',
            subtitle: 'Post class-wide notices, reminders, and important updates.'
        },
        attendance: {
            title: 'Attendance',
            subtitle: 'Update student attendance. Teacher attendance is read-only.'
        },
        profile: {
            title: 'My Profile',
            subtitle: 'Keep your teacher profile up to date.'
        }
    };

    const data = loadData();
    ensureTodayAttendance(data);
    saveData(data);

    const state = {
        selectedStudentId: data.students[0] ? data.students[0].id : null,
        pendingAttendance: {}
    };

    const teacherNameEl = document.getElementById('teacherName');
    if (teacherNameEl) {
        teacherNameEl.textContent = getNameFromToken(token);
    }

    const viewTitleEl = document.getElementById('viewTitle');
    const viewSubtitleEl = document.getElementById('viewSubtitle');
    const currentView = document.body.dataset.view || 'overview';
    const isMultiPage = document.body.dataset.layout === 'multipage';

    const switchView = (viewId) => {
        const resolvedView = viewId || currentView || 'overview';
        document.querySelectorAll('.teacher-view').forEach((section) => {
            section.classList.remove('active');
        });
        const target = document.getElementById(`view-${resolvedView}`);
        if (target) {
            target.classList.add('active');
        }

        document.querySelectorAll('.sidebar-nav a[data-view]').forEach((link) => {
            if (link.dataset.view === resolvedView) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        const viewMeta = viewTitles[resolvedView];
        if (viewMeta) {
            viewTitleEl.textContent = viewMeta.title;
            viewSubtitleEl.textContent = viewMeta.subtitle;
        }
    };

    document.querySelectorAll('.sidebar-nav a[data-view]').forEach((link) => {
        if (isMultiPage) {
            return;
        }
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const viewId = link.dataset.view;
            if (viewId) {
                switchView(viewId);
            }
        });
    });

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('is_admin');
            localStorage.removeItem('user_role');
            window.location.href = '../index.html';
        });
    }

    const getStudentById = (studentId) => data.students.find((student) => student.id === studentId);

    const populateStudentSelect = (selectEl, includeAll) => {
        if (!selectEl) return;
        selectEl.innerHTML = '';
        if (includeAll) {
            const opt = document.createElement('option');
            opt.value = 'all';
            opt.textContent = 'All Students';
            selectEl.appendChild(opt);
        }
        data.students.forEach((student) => {
            const opt = document.createElement('option');
            opt.value = student.id;
            opt.textContent = student.name;
            selectEl.appendChild(opt);
        });
    };

    const messageStudentSelect = document.getElementById('messageStudentSelect');
    const assignmentStudentSelect = document.getElementById('assignmentStudentSelect');
    const performanceStudentSelect = document.getElementById('performanceStudentSelect');

    populateStudentSelect(messageStudentSelect, false);
    populateStudentSelect(assignmentStudentSelect, true);
    populateStudentSelect(performanceStudentSelect, false);

    const renderOverview = () => {
        const totalStudents = data.students.length;
        const activeAssignments = data.assignments.filter((assignment) => assignment.status !== 'Completed').length;
        const messageCount = data.messages.length;
        const attendanceRecords = Object.values(data.attendance.records || {});
        const markedCount = attendanceRecords.filter((record) => record.status && record.status !== 'Unmarked').length;
        const attendanceRate = totalStudents === 0 ? 0 : Math.round((markedCount / totalStudents) * 100);

        const statStudents = document.getElementById('statStudents');
        const statAssignments = document.getElementById('statAssignments');
        const statMessages = document.getElementById('statMessages');
        const statAttendance = document.getElementById('statAttendance');

        if (statStudents) statStudents.textContent = String(totalStudents);
        if (statAssignments) statAssignments.textContent = String(activeAssignments);
        if (statMessages) statMessages.textContent = String(messageCount);
        if (statAttendance) statAttendance.textContent = `${attendanceRate}%`;

        const deadlinesEl = document.getElementById('overviewDeadlines');
        if (!deadlinesEl) return;
        deadlinesEl.innerHTML = '';
        const upcoming = data.assignments
            .filter((assignment) => assignment.status !== 'Completed' && assignment.dueDate)
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 4);

        if (upcoming.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'readonly-note';
            empty.textContent = 'No upcoming items yet.';
            deadlinesEl.appendChild(empty);
            return;
        }

        upcoming.forEach((assignment) => {
            const item = document.createElement('div');
            item.className = 'status-pill';
            item.textContent = `${assignment.title} - due ${formatDisplayDate(assignment.dueDate)}`;
            deadlinesEl.appendChild(item);
        });
    };

    const renderStudentList = () => {
        const listEl = document.getElementById('studentList');
        if (!listEl) return;
        listEl.innerHTML = '';

        data.students.forEach((student) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = student.name;
            if (student.id === state.selectedStudentId) {
                btn.classList.add('active');
            }
            btn.addEventListener('click', () => {
                state.selectedStudentId = student.id;
                renderStudentList();
                renderStudentDetail();
            });
            listEl.appendChild(btn);
        });
    };

    const setValue = (el, value) => {
        if (!el) return;
        el.value = value || '';
    };

    const renderStudentDetail = () => {
        const student = getStudentById(state.selectedStudentId);
        const detailName = document.getElementById('studentDetailName');
        const detailMeta = document.getElementById('studentDetailMeta');

        if (!student) {
            if (detailName) detailName.textContent = 'Select a student';
            if (detailMeta) detailMeta.textContent = 'Choose a student to edit their profile, parent details, and achievements.';
            return;
        }

        if (detailName) detailName.textContent = student.name;
        if (detailMeta) detailMeta.textContent = `${student.grade} | ${student.email}`;

        setValue(document.getElementById('studentNameInput'), student.name);
        setValue(document.getElementById('studentEmailInput'), student.email);
        setValue(document.getElementById('studentGradeInput'), student.grade);
        setValue(document.getElementById('studentPhoneInput'), student.phone);

        setValue(document.getElementById('parentNameInput'), student.parent?.name);
        setValue(document.getElementById('parentRelationInput'), student.parent?.relation);
        setValue(document.getElementById('parentPhoneInput'), student.parent?.phone);
        setValue(document.getElementById('parentEmailInput'), student.parent?.email);
        setValue(document.getElementById('parentAddressInput'), student.parent?.address);
        setValue(document.getElementById('parentEmergencyInput'), student.parent?.emergency);

        const achievementList = document.getElementById('achievementList');
        if (achievementList) {
            achievementList.innerHTML = '';
            const achievements = student.achievements || [];
            if (achievements.length === 0) {
                const empty = document.createElement('p');
                empty.className = 'readonly-note';
                empty.textContent = 'No achievements recorded yet.';
                achievementList.appendChild(empty);
            } else {
                achievements.forEach((achievement) => {
                    const item = document.createElement('div');
                    item.className = 'message-card';
                    item.innerHTML = `
                        <strong>${achievement.title}</strong>
                        <span class="message-meta">${formatDisplayDate(achievement.date)} | ${achievement.note || 'General'}</span>
                    `;
                    achievementList.appendChild(item);
                });
            }
        }
    };

    const saveStudentProfileBtn = document.getElementById('saveStudentProfileBtn');
    if (saveStudentProfileBtn) {
        saveStudentProfileBtn.addEventListener('click', (event) => {
            event.preventDefault();
            const student = getStudentById(state.selectedStudentId);
            if (!student) return;
            student.name = document.getElementById('studentNameInput').value.trim() || student.name;
            student.email = document.getElementById('studentEmailInput').value.trim() || student.email;
            student.grade = document.getElementById('studentGradeInput').value.trim() || student.grade;
            student.phone = document.getElementById('studentPhoneInput').value.trim() || student.phone;
            saveData(data);
            renderStudentList();
            renderStudentDetail();
        });
    }

    const saveParentBtn = document.getElementById('saveParentBtn');
    if (saveParentBtn) {
        saveParentBtn.addEventListener('click', (event) => {
            event.preventDefault();
            const student = getStudentById(state.selectedStudentId);
            if (!student) return;
            student.parent = {
                name: document.getElementById('parentNameInput').value.trim(),
                relation: document.getElementById('parentRelationInput').value.trim(),
                phone: document.getElementById('parentPhoneInput').value.trim(),
                email: document.getElementById('parentEmailInput').value.trim(),
                address: document.getElementById('parentAddressInput').value.trim(),
                emergency: document.getElementById('parentEmergencyInput').value.trim()
            };
            saveData(data);
            renderStudentDetail();
        });
    }

    const addAchievementBtn = document.getElementById('addAchievementBtn');
    if (addAchievementBtn) {
        addAchievementBtn.addEventListener('click', (event) => {
            event.preventDefault();
            const student = getStudentById(state.selectedStudentId);
            if (!student) return;
            const title = document.getElementById('achievementTitleInput').value.trim();
            if (!title) return;
            const date = document.getElementById('achievementDateInput').value;
            const note = document.getElementById('achievementNoteInput').value.trim();
            const newAchievement = {
                id: `ach-${Date.now()}`,
                title,
                date: date || formatISODate(new Date()),
                note
            };
            student.achievements = student.achievements || [];
            student.achievements.unshift(newAchievement);
            saveData(data);
            document.getElementById('achievementTitleInput').value = '';
            document.getElementById('achievementDateInput').value = '';
            document.getElementById('achievementNoteInput').value = '';
            renderStudentDetail();
        });
    }

    const messageFeed = document.getElementById('messageFeed');
    const renderMessages = () => {
        if (!messageFeed) return;
        messageFeed.innerHTML = '';
        const sorted = [...data.messages].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        if (sorted.length === 0) {
            messageFeed.innerHTML = '<p class="community-placeholder">No messages sent yet.</p>';
            return;
        }
        sorted.forEach((message) => {
            const card = document.createElement('div');
            card.className = 'message-card';
            card.innerHTML = `
                <strong>${message.subject}</strong>
                <div class="message-meta">
                    <span>${message.studentName}</span>
                    <span>${formatDisplayDate(message.timestamp)}</span>
                </div>
                <p>${message.body}</p>
            `;
            messageFeed.appendChild(card);
        });
    };

    const messageSendBtn = document.getElementById('messageSendBtn');
    if (messageSendBtn) {
        messageSendBtn.addEventListener('click', (event) => {
            event.preventDefault();
            const studentId = messageStudentSelect.value;
            const subject = document.getElementById('messageSubjectInput').value.trim();
            const body = document.getElementById('messageBodyInput').value.trim();
            if (!studentId || !subject || !body) return;
            const student = getStudentById(studentId);
            data.messages.unshift({
                id: `msg-${Date.now()}`,
                studentId,
                studentName: student ? student.name : 'Student',
                subject,
                body,
                timestamp: new Date().toISOString()
            });
            saveData(data);
            document.getElementById('messageSubjectInput').value = '';
            document.getElementById('messageBodyInput').value = '';
            renderMessages();
            renderOverview();
        });
    }

    const performanceRating = document.getElementById('performanceRating');
    const performanceRatingValue = document.getElementById('performanceRatingValue');
    const performanceUps = document.getElementById('performanceUps');
    const performanceDowns = document.getElementById('performanceDowns');

    const applyPerformanceToForm = (student) => {
        if (!student) return;
        const rating = student.progress?.rating || 3;
        performanceRating.value = String(rating);
        performanceRatingValue.textContent = String(rating);
        performanceUps.value = student.progress?.ups || '';
        performanceDowns.value = student.progress?.downs || '';
    };

    if (performanceRating) {
        performanceRating.addEventListener('input', () => {
            performanceRatingValue.textContent = performanceRating.value;
        });
    }

    if (performanceStudentSelect) {
        performanceStudentSelect.addEventListener('change', () => {
            const student = getStudentById(performanceStudentSelect.value);
            applyPerformanceToForm(student);
        });
    }

    const renderPerformanceSummary = () => {
        const summaryEl = document.getElementById('performanceSummary');
        if (!summaryEl) return;
        summaryEl.innerHTML = '';
        data.students.forEach((student) => {
            const rating = student.progress?.rating || 3;
            const ups = student.progress?.ups || 'No notes yet.';
            const downs = student.progress?.downs || 'No notes yet.';
            const card = document.createElement('div');
            card.className = 'message-card';
            card.innerHTML = `
                <strong>${student.name} (Rating ${rating}/5)</strong>
                <p><span class="status-pill">Ups</span> ${ups}</p>
                <p><span class="status-pill">Downs</span> ${downs}</p>
            `;
            summaryEl.appendChild(card);
        });
    };

    const savePerformanceBtn = document.getElementById('savePerformanceBtn');
    if (savePerformanceBtn) {
        savePerformanceBtn.addEventListener('click', (event) => {
            event.preventDefault();
            const student = getStudentById(performanceStudentSelect.value);
            if (!student) return;
            student.progress = {
                rating: Number(performanceRating.value),
                ups: performanceUps.value.trim(),
                downs: performanceDowns.value.trim()
            };
            saveData(data);
            renderPerformanceSummary();
        });
    }

    const assignmentList = document.getElementById('assignmentList');
    const renderAssignments = () => {
        if (!assignmentList) return;
        assignmentList.innerHTML = '';
        if (data.assignments.length === 0) {
            assignmentList.innerHTML = '<p class="community-placeholder">No assignments yet.</p>';
            return;
        }
        data.assignments.forEach((assignment) => {
            const studentName = assignment.studentId === 'all'
                ? 'All Students'
                : (getStudentById(assignment.studentId)?.name || 'Student');
            const card = document.createElement('div');
            card.className = 'assignment-card';
            card.innerHTML = `
                <strong>${assignment.title}</strong>
                <div class="assignment-meta">
                    <span>${assignment.type}</span>
                    <span>${studentName}</span>
                    <span>Due ${formatDisplayDate(assignment.dueDate)}</span>
                    <span>Status: ${assignment.status}</span>
                </div>
                <p>${assignment.details}</p>
                <div class="action-row">
                    ${assignment.status !== 'Completed' ? `<button data-action="complete" data-id="${assignment.id}" class="community-submit-btn">Mark Completed</button>` : ''}
                    <button data-action="remove" data-id="${assignment.id}" class="danger-btn">Remove</button>
                </div>
            `;
            assignmentList.appendChild(card);
        });
    };

    if (assignmentList) {
        assignmentList.addEventListener('click', (event) => {
            const btn = event.target.closest('button[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            const id = btn.dataset.id;
            const target = data.assignments.find((assignment) => assignment.id === id);
            if (!target) return;
            if (action === 'complete') {
                target.status = 'Completed';
            }
            if (action === 'remove') {
                data.assignments = data.assignments.filter((assignment) => assignment.id !== id);
            }
            saveData(data);
            renderAssignments();
            renderOverview();
        });
    }

    const assignmentAddBtn = document.getElementById('assignmentAddBtn');
    if (assignmentAddBtn) {
        assignmentAddBtn.addEventListener('click', (event) => {
            event.preventDefault();
            const title = document.getElementById('assignmentTitleInput').value.trim();
            const type = document.getElementById('assignmentTypeSelect').value;
            const studentId = assignmentStudentSelect.value;
            const dueDate = document.getElementById('assignmentDueInput').value;
            const details = document.getElementById('assignmentDetailsInput').value.trim();
            if (!title || !studentId || !dueDate) return;
            data.assignments.unshift({
                id: `asg-${Date.now()}`,
                title,
                type,
                studentId,
                dueDate,
                details,
                status: 'Assigned'
            });
            saveData(data);
            document.getElementById('assignmentTitleInput').value = '';
            document.getElementById('assignmentDetailsInput').value = '';
            renderAssignments();
            renderOverview();
        });
    }

    const attendanceDateLabel = document.getElementById('attendanceDateLabel');
    const attendanceTableBody = document.getElementById('attendanceTableBody');
    const renderAttendance = () => {
        if (!attendanceTableBody) return;
        attendanceTableBody.innerHTML = '';
        state.pendingAttendance = {};
        if (attendanceDateLabel) attendanceDateLabel.textContent = formatDisplayDate(data.attendance.date);

        data.students.forEach((student) => {
            const current = data.attendance.records[student.id] || { status: 'Unmarked' };
            state.pendingAttendance[student.id] = { status: current.status || 'Unmarked' };
            const row = document.createElement('tr');
            const statusOptions = ['Present', 'Absent', 'Late', 'Excused', 'Unmarked'];
            row.innerHTML = `
                <td>${student.name}</td>
                <td>
                    <select class="attendance-select" data-student-id="${student.id}">
                        ${statusOptions.map((option) => `<option value="${option}">${option}</option>`).join('')}
                    </select>
                </td>
            `;
            const select = row.querySelector('select');
            select.value = current.status || 'Unmarked';
            select.addEventListener('change', () => {
                state.pendingAttendance[student.id].status = select.value;
            });
            attendanceTableBody.appendChild(row);
        });
    };

    const attendanceSaveBtn = document.getElementById('attendanceSaveBtn');
    if (attendanceSaveBtn) {
        attendanceSaveBtn.addEventListener('click', () => {
            data.attendance.records = { ...state.pendingAttendance };
            saveData(data);
            renderOverview();
        });
    }

    const teacherAttendanceList = document.getElementById('teacherAttendanceList');
    const renderTeacherAttendance = () => {
        if (!teacherAttendanceList) return;
        teacherAttendanceList.innerHTML = '';
        data.teacherAttendance.forEach((entry) => {
            const card = document.createElement('div');
            card.className = 'attendance-card';
            card.innerHTML = `
                <strong>${formatDisplayDate(entry.date)}</strong>
                <span class="status-pill">Status: ${entry.status}</span>
                <span class="readonly-note">In: ${entry.inTime} | Out: ${entry.outTime}</span>
            `;
            teacherAttendanceList.appendChild(card);
        });
    };

    const teacherProfileName = document.getElementById('teacherProfileName');
    const teacherProfileEmail = document.getElementById('teacherProfileEmail');
    const teacherProfileSubject = document.getElementById('teacherProfileSubject');
    const teacherProfilePhone = document.getElementById('teacherProfilePhone');
    const teacherProfileBio = document.getElementById('teacherProfileBio');

    const renderTeacherProfile = () => {
        const profile = data.teacherProfile || {};
        if (teacherProfileName) teacherProfileName.value = profile.name || '';
        if (teacherProfileEmail) teacherProfileEmail.value = profile.email || '';
        if (teacherProfileSubject) teacherProfileSubject.value = profile.subject || '';
        if (teacherProfilePhone) teacherProfilePhone.value = profile.phone || '';
        if (teacherProfileBio) teacherProfileBio.value = profile.bio || '';
    };

    const saveTeacherProfileBtn = document.getElementById('saveTeacherProfileBtn');
    if (saveTeacherProfileBtn) {
        saveTeacherProfileBtn.addEventListener('click', (event) => {
            event.preventDefault();
            data.teacherProfile = {
                name: teacherProfileName.value.trim(),
                email: teacherProfileEmail.value.trim(),
                subject: teacherProfileSubject.value.trim(),
                phone: teacherProfilePhone.value.trim(),
                bio: teacherProfileBio.value.trim()
            };
            saveData(data);
            if (teacherNameEl && data.teacherProfile.name) {
                teacherNameEl.textContent = data.teacherProfile.name.split(' ')[0];
            }
        });
    }

    renderOverview();
    renderStudentList();
    renderStudentDetail();
    renderMessages();
    renderAssignments();
    renderAttendance();
    renderTeacherAttendance();
    renderPerformanceSummary();
    renderTeacherProfile();

    if (performanceStudentSelect) {
        performanceStudentSelect.value = state.selectedStudentId || performanceStudentSelect.value;
        const student = getStudentById(performanceStudentSelect.value);
        applyPerformanceToForm(student);
    }

    // ── Ensure grades & announcements arrays exist (backward compat) ──────
    if (!data.grades) { data.grades = []; saveData(data); }
    if (!data.announcements) { data.announcements = []; saveData(data); }

    // ── Grades ─────────────────────────────────────────────────────────────
    const gradeStudentSelect   = document.getElementById('gradeStudentSelect');
    const gradeStudentListEl   = document.getElementById('gradeStudentList');
    const gradeTableEl         = document.getElementById('gradeTable');
    const gradeStudentTitle    = document.getElementById('gradeStudentTitle');
    const gradeAvgBadge        = document.getElementById('gradeAvgBadge');
    const classGradeOverviewEl = document.getElementById('classGradeOverview');

    let selectedGradeStudentId = data.students[0] ? data.students[0].id : null;

    populateStudentSelect(gradeStudentSelect, false);

    const renderGradeStudentList = () => {
        if (!gradeStudentListEl) return;
        gradeStudentListEl.innerHTML = '';
        data.students.forEach((student) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = student.name;
            if (student.id === selectedGradeStudentId) btn.classList.add('active');
            btn.addEventListener('click', () => {
                selectedGradeStudentId = student.id;
                renderGradeStudentList();
                renderGradeTable();
            });
            gradeStudentListEl.appendChild(btn);
        });
    };

    const getLetterGrade = (pct) => {
        if (pct >= 90) return { letter: 'A+', color: '#4ade80' };
        if (pct >= 80) return { letter: 'A', color: '#86efac' };
        if (pct >= 70) return { letter: 'B', color: '#93c5fd' };
        if (pct >= 60) return { letter: 'C', color: '#fde047' };
        if (pct >= 50) return { letter: 'D', color: '#fca5a5' };
        return { letter: 'F', color: '#ef4444' };
    };

    const renderGradeTable = () => {
        if (!gradeTableEl) return;
        const student = getStudentById(selectedGradeStudentId);
        if (!student) return;

        if (gradeStudentTitle) gradeStudentTitle.textContent = student.name;

        const studentGrades = data.grades.filter((g) => g.studentId === selectedGradeStudentId);
        gradeTableEl.innerHTML = '';

        if (studentGrades.length === 0) {
            gradeTableEl.innerHTML = '<p class="community-placeholder">No grades recorded for this student yet.</p>';
            if (gradeAvgBadge) gradeAvgBadge.style.display = 'none';
            return;
        }

        const avg = studentGrades.reduce((acc, g) => acc + (g.score / g.maxScore) * 100, 0) / studentGrades.length;
        const { letter, color } = getLetterGrade(avg);
        if (gradeAvgBadge) {
            gradeAvgBadge.style.display = 'inline-flex';
            gradeAvgBadge.textContent = `Avg: ${avg.toFixed(1)}% (${letter})`;
            gradeAvgBadge.style.color = color;
        }

        studentGrades.forEach((grade) => {
            const pct = Math.round((grade.score / grade.maxScore) * 100);
            const { letter: gl, color: gc } = getLetterGrade(pct);
            const card = document.createElement('div');
            card.className = 'assignment-card';
            card.innerHTML = `
                <strong>${grade.subject} — ${grade.examName || 'Exam'}</strong>
                <div class="assignment-meta">
                    <span>${formatDisplayDate(grade.date)}</span>
                    <span style="color:${gc}; font-weight:700;">${grade.score}/${grade.maxScore} (${pct}% — ${gl})</span>
                </div>
                ${grade.remark ? `<p style="color: var(--text-secondary); font-size: 0.88rem;">${grade.remark}</p>` : ''}
                <div class="action-row">
                    <button data-action="delete-grade" data-id="${grade.id}" class="danger-btn">Remove</button>
                </div>
            `;
            gradeTableEl.appendChild(card);
        });
    };

    if (gradeTableEl) {
        gradeTableEl.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action="delete-grade"]');
            if (!btn) return;
            data.grades = data.grades.filter((g) => g.id !== btn.dataset.id);
            saveData(data);
            renderGradeTable();
            renderClassOverview();
        });
    }

    const renderClassOverview = () => {
        if (!classGradeOverviewEl) return;
        classGradeOverviewEl.innerHTML = '';
        data.students.forEach((student) => {
            const studentGrades = data.grades.filter((g) => g.studentId === student.id);
            const avg = studentGrades.length > 0
                ? studentGrades.reduce((acc, g) => acc + (g.score / g.maxScore) * 100, 0) / studentGrades.length
                : null;
            const { letter, color } = avg !== null ? getLetterGrade(avg) : { letter: 'N/A', color: 'var(--text-secondary)' };

            const card = document.createElement('div');
            card.className = 'stat-box';
            card.style.cursor = 'pointer';
            card.innerHTML = `
                <span>${student.name}</span>
                <strong style="color:${color}">${avg !== null ? avg.toFixed(1) + '%' : '--'} <small style="font-size:0.85rem;">${letter}</small></strong>
            `;
            card.addEventListener('click', () => {
                selectedGradeStudentId = student.id;
                renderGradeStudentList();
                renderGradeTable();
                // Scroll to table
                if (gradeTableEl) gradeTableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            classGradeOverviewEl.appendChild(card);
        });
    };

    const gradeAddBtn = document.getElementById('gradeAddBtn');
    if (gradeAddBtn) {
        gradeAddBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const studentId  = gradeStudentSelect ? gradeStudentSelect.value : null;
            const subject    = document.getElementById('gradeSubjectInput')?.value.trim();
            const score      = parseInt(document.getElementById('gradeScoreInput')?.value, 10);
            const maxScore   = parseInt(document.getElementById('gradeMaxInput')?.value, 10) || 100;
            const examName   = document.getElementById('gradeExamInput')?.value.trim();
            const examDate   = document.getElementById('gradeExamDateInput')?.value;
            const remark     = document.getElementById('gradeRemarkInput')?.value.trim();

            if (!studentId || !subject || isNaN(score)) return;

            data.grades.push({
                id: `g-${Date.now()}`,
                studentId,
                subject,
                examName: examName || 'Exam',
                score: Math.min(score, maxScore),
                maxScore,
                date: examDate || formatISODate(new Date()),
                remark
            });
            saveData(data);

            // Clear form
            ['gradeSubjectInput','gradeScoreInput','gradeMaxInput','gradeExamInput','gradeExamDateInput','gradeRemarkInput'].forEach((id) => {
                const el = document.getElementById(id);
                if (el) el.value = el.id === 'gradeMaxInput' ? '100' : '';
            });

            selectedGradeStudentId = studentId;
            renderGradeStudentList();
            renderGradeTable();
            renderClassOverview();
        });
    }

    renderGradeStudentList();
    renderGradeTable();
    renderClassOverview();

    // ── Announcements ──────────────────────────────────────────────────────
    const announcementFeed      = document.getElementById('announcementFeed');
    const announcementPostBtn   = document.getElementById('announcementPostBtn');
    const clearAnnouncementsBtn = document.getElementById('clearAnnouncementsBtn');

    const PRIORITY_STYLES = {
        info:     { label: 'ℹ️ Info',     bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.3)',  color: '#818cf8' },
        reminder: { label: '⏰ Reminder', bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.35)', color: '#fbbf24' },
        urgent:   { label: '🚨 Urgent',   bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.35)',  color: '#f87171' }
    };

    const renderAnnouncements = async () => {
        if (!announcementFeed) return;
        try {
            const res = await fetch('http://127.0.0.1:8000/api/announcements', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch announcements");
            const announcements = await res.json();
            
            announcementFeed.innerHTML = '';
            if (announcements.length === 0) {
                announcementFeed.innerHTML = '<p class="community-placeholder">No announcements yet. Post your first one! 📢</p>';
                return;
            }
            announcements.forEach((ann) => {
                const style = PRIORITY_STYLES[ann.priority] || PRIORITY_STYLES.info;
                const card = document.createElement('div');
                card.className = 'message-card';
                card.style.borderLeft = `4px solid ${style.color}`;
                card.innerHTML = `
                    <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.35rem;">
                        <span style="font-size:0.75rem; font-weight:600; padding:0.2rem 0.5rem; border-radius:999px; background:${style.bg}; color:${style.color}; border:1px solid ${style.border};">${style.label}</span>
                        <strong style="flex:1;">${ann.title}</strong>
                        <button data-action="delete-ann" data-id="${ann.id}" style="width:auto; background:transparent; border:none; color:#94a3b8; cursor:pointer; padding:0.2rem 0.4rem; font-size:0.85rem; box-shadow:none;">✕</button>
                    </div>
                    <p style="color:var(--text-secondary); font-size:0.9rem; line-height:1.5;">${ann.body}</p>
                    <span class="readonly-note">${formatDisplayDate(ann.created_at)}</span>
                `;
                announcementFeed.appendChild(card);
            });
        } catch (err) {
            console.error("Error loading announcements:", err);
            announcementFeed.innerHTML = '<p class="community-placeholder" style="color: red;">Failed to load announcements.</p>';
        }
    };

    if (announcementFeed) {
        announcementFeed.addEventListener('click', async (e) => {
            const btn = e.target.closest('button[data-action="delete-ann"]');
            if (!btn) return;
            const annId = btn.dataset.id;
            try {
                const res = await fetch(`http://127.0.0.1:8000/api/announcements/${annId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    renderAnnouncements();
                } else {
                    alert('Failed to delete announcement');
                }
            } catch (err) {
                console.error("Error deleting announcement:", err);
            }
        });
    }

    if (announcementPostBtn) {
        announcementPostBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const title    = document.getElementById('announcementTitleInput')?.value.trim();
            const body     = document.getElementById('announcementBodyInput')?.value.trim();
            const priority = document.getElementById('announcementPrioritySelect')?.value || 'info';
            if (!title || !body) return;
            
            try {
                const res = await fetch('http://127.0.0.1:8000/api/announcements', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ title, body, priority })
                });
                if (res.ok) {
                    const titleEl = document.getElementById('announcementTitleInput');
                    const bodyEl  = document.getElementById('announcementBodyInput');
                    if (titleEl) titleEl.value = '';
                    if (bodyEl)  bodyEl.value  = '';
                    renderAnnouncements();
                } else {
                    alert('Failed to post announcement');
                }
            } catch (err) {
                console.error("Error posting announcement:", err);
            }
        });
    }

    if (clearAnnouncementsBtn) {
        clearAnnouncementsBtn.addEventListener('click', () => {
            alert('Clearing all announcements is currently not supported via API.');
        });
    }

    renderAnnouncements();

    const initialView = isMultiPage ? currentView : 'overview';
    switchView(initialView);

    // Fetch real students from the backend and update the UI
    async function fetchRealStudents() {
        try {
            const res = await fetch('http://127.0.0.1:8000/api/teacher/students', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const realStudents = await res.json();
                
                const newStudentsList = realStudents.map(rs => {
                    const existing = data.students.find(s => s.id === rs.id) || {};
                    return {
                        id: rs.id,
                        name: rs.name || 'Student View',
                        email: rs.email,
                        grade: existing.grade || rs.department || 'N/A',
                        phone: existing.phone || rs.mobile || 'N/A',
                        parent: existing.parent || {},
                        achievements: existing.achievements || [],
                        progress: existing.progress || { rating: 3, ups: '', downs: '' }
                    };
                });
                
                if (newStudentsList.length > 0) {
                    data.students = newStudentsList;
                    saveData(data);
                    
                    if (typeof populateStudentSelect === 'function') {
                        const messageStudentSelect = document.getElementById('messageStudentSelect');
                        const assignmentStudentSelect = document.getElementById('assignmentStudentSelect');
                        const performanceStudentSelect = document.getElementById('performanceStudentSelect');
                        populateStudentSelect(messageStudentSelect, false);
                        populateStudentSelect(assignmentStudentSelect, true);
                        populateStudentSelect(performanceStudentSelect, false);
                    }
                    
                    if (!data.students.find(s => s.id === state.selectedStudentId)) {
                        state.selectedStudentId = data.students[0] ? data.students[0].id : null;
                    }

                    if (currentView === 'overview' && typeof renderOverview === 'function') renderOverview();
                    if (currentView === 'records' && typeof renderStudentList === 'function') renderStudentList();
                    if (currentView === 'records' && typeof renderStudentDetail === 'function') renderStudentDetail();
                    if (currentView === 'communication' && typeof renderMessages === 'function') renderMessages();
                }
            }
        } catch(error) {
            console.error('Error fetching real students:', error);
        }
    }
    fetchRealStudents();
});
