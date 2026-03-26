// 数据存储
class StudentCRM {
    constructor() {
        this.students = this.loadData();
        this.renderStudents();
        this.updateStats();
    }

    // 数据持久化
    loadData() {
        const saved = localStorage.getItem('students');
        return saved ? JSON.parse(saved) : [];
    }

    saveData() {
        localStorage.setItem('students', JSON.stringify(this.students));
        this.updateStats();
    }

    // 添加学生
    addStudent(name, phone, courses, notes) {
        const student = {
            id: Date.now(),
            name,
            phone,
            courses: courses.map(c => ({
                id: Date.now() + Math.random(),
                name: c.name,
                totalHours: c.hours,
                remainingHours: c.hours,
                deductionHistory: []
            })),
            notes,
            createdAt: new Date().toISOString(),
            lastVisit: null
        };
        this.students.push(student);
        this.saveData();
        return student;
    }

    // 销课（扣课时）
    deductHours(studentId, courseName, hours, reason = '') {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return { success: false, message: '学生不存在' };

        const course = student.courses.find(c => c.name === courseName);
        if (!course) return { success: false, message: `课程 "${courseName}" 不存在` };

        if (course.remainingHours < hours) {
            return { 
                success: false, 
                message: `${courseName}课时不足，剩余${course.remainingHours}节` 
            };
        }

        course.remainingHours -= hours;
        course.deductionHistory.push({
            date: new Date().toISOString(),
            hours,
            reason,
            type: 'deduct'
        });

        student.lastVisit = new Date().toISOString();
        this.saveData();

        return {
            success: true,
            message: `✅ ${student.name}的${courseName}已销${hours}节课，剩余${course.remainingHours}节`,
            student,
            course
        };
    }

    // 添加课时
    addHours(studentId, courseName, hours, reason = '') {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return { success: false, message: '学生不存在' };

        const course = student.courses.find(c => c.name === courseName);
        if (!course) return { success: false, message: `课程 "${courseName}" 不存在` };

        course.remainingHours += hours;
        course.totalHours += hours;
        course.deductionHistory.push({
            date: new Date().toISOString(),
            hours,
            reason,
            type: 'add'
        });

        this.saveData();

        return {
            success: true,
            message: `✅ ${student.name}的${courseName}已增加${hours}节课，现有${course.remainingHours}节`,
            student,
            course
        };
    }

    // 语音识别和处理
    parseVoiceCommand(text) {
        const patterns = [
            /(.+?)(?:销|扣|上了)(\d+)节(.+?)课/,
            /(.+?)(?:增加|加)(\d+)节(.+?)课/,
            /(.+?)(\d+)(.+?)课/
        ];

        for (let pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                const studentName = match[1].trim();
                const hours = parseInt(match[2]);
                const courseName = match[3].trim();
                
                const isAdd = text.includes('增加') || text.includes('加');
                const action = isAdd ? 'add' : 'deduct';

                return {
                    success: true,
                    studentName,
                    courseName,
                    hours,
                    action,
                    raw: text
                };
            }
        }

        return {
            success: false,
            message: '无法识别命令，请使用格式：张三销2节数学课'
        };
    }

    // 执行语音命令
    executeVoiceCommand(text) {
        const parsed = this.parseVoiceCommand(text);
        if (!parsed.success) {
            return parsed;
        }

        const student = this.students.find(s => s.name === parsed.studentName);
        if (!student) {
            return {
                success: false,
                message: `❌ 找不到学生 "${parsed.studentName}"`
            };
        }

        if (parsed.action === 'deduct') {
            return this.deductHours(student.id, parsed.courseName, parsed.hours, `语音销课: ${text}`);
        } else {
            return this.addHours(student.id, parsed.courseName, parsed.hours, `语音增加: ${text}`);
        }
    }

    // 搜索学生
    searchStudents(keyword, filter = 'all') {
        let results = this.students;

        if (keyword) {
            results = results.filter(s => s.name.includes(keyword));
        }

        if (filter === 'active') {
            results = results.filter(s => s.courses.some(c => c.remainingHours > 0));
        } else if (filter === 'inactive') {
            results = results.filter(s => s.courses.every(c => c.remainingHours === 0));
        }

        return results;
    }

    // 获取统计数据
    getStats() {
        const today = new Date().toDateString();
        let todayDeductions = 0;
        let monthlyDeductions = 0;
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        this.students.forEach(student => {
            student.courses.forEach(course => {
                course.deductionHistory.forEach(record => {
                    if (record.type === 'deduct') {
                        const recordDate = new Date(record.date);
                        if (recordDate.toDateString() === today) {
                            todayDeductions += record.hours;
                        }
                        if (recordDate >= monthStart) {
                            monthlyDeductions += record.hours;
                        }
                    }
                });
            });
        });

        return {
            totalStudents: this.students.length,
            todayDeductions,
            monthlyDeductions
        };
    }

    // 渲染学生列表
    renderStudents(keyword = '', filter = 'all') {
        const grid = document.getElementById('studentsGrid');
        const students = this.searchStudents(keyword, filter);

        if (students.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">暂无学生数据</div>';
            return;
        }

        grid.innerHTML = students.map(student => {
            const totalRemaining = student.courses.reduce((sum, c) => sum + c.remainingHours, 0);
            const statusClass = totalRemaining > 0 ? 'hours-ok' : 'hours-warning';
            const statusText = totalRemaining > 0 ? `剩余${totalRemaining}节课` : '课时已用完';

            return `
                <div class="student-card" onclick="crm.showStudentDetail(${student.id})">
                    <h3>${student.name}</h3>
                    <div class="phone">${student.phone || '无'}</div>
                    ${student.courses.map(course => `
                        <div class="course-info">
                            <div class="course-name">${course.name}</div>
                            <div class="course-hours">
                                <span class="${statusClass}">${course.remainingHours}/${course.totalHours}</span> 节
                            </div>
                        </div>
                    `).join('')}
                    <div class="last-visit">
                        ${student.lastVisit ? `最后访问: ${new Date(student.lastVisit).toLocaleDateString()}` : '未访问'}
                    </div>
                </div>
            `;
        }).join('');
    }

    // 显示学生详情
    showStudentDetail(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        const panel = document.getElementById('studentDetailPanel');
        const detail = document.getElementById('studentDetail');

        const historyHtml = student.courses.map(course => {
            const history = course.deductionHistory.slice(-10).reverse();
            return `
                <div class="detail-section">
                    <h3>${course.name}</h3>
                    <div style="margin-bottom: 15px;">
                        <strong>总课时: ${course.totalHours} | 剩余: ${course.remainingHours}</strong>
                    </div>
                    <div class="history-list">
                        ${history.length > 0 ? history.map(record => `
                            <div class="history-item">
                                <div>
                                    <div class="action ${record.type === 'deduct' ? 'deduct' : 'add'}">
                                        ${record.type === 'deduct' ? '销课' : '增加'} ${record.hours}节
                                    </div>
                                    <div class="date">${new Date(record.date).toLocaleString()}</div>
                                </div>
                            </div>
                        `).join('') : '<div style="color: #999;">暂无记录</div>'}
                    </div>
                </div>
            `;
        }).join('');

        detail.innerHTML = `
            <div class="detail-header">
                <div>
                    <h2>${student.name}</h2>
                    <p style="color: #666; margin-top: 5px;">${student.phone || '无'}</p>
                </div>
                <div class="detail-actions">
                    <button class="btn-danger" onclick="crm.deleteStudent(${student.id})">删除</button>
                    <button class="btn-secondary" onclick="crm.closeDetail()">关闭</button>
                </div>
            </div>

            <div class="detail-section">
                <h3>快速销课</h3>
                <div class="courses-list">
                    ${student.courses.map(course => `
                        <div class="course-item">
                            <div class="course-item-info">
                                <h4>${course.name}</h4>
                                <p>剩余: ${course.remainingHours}/${course.totalHours}节</p>
                            </div>
                            <div class="course-item-actions">
                                <input type="number" id="hours-${course.id}" value="1" min="1" max="${course.remainingHours}">
                                <button class="btn-success" onclick="crm.quickDeduct(${student.id}, '${course.name}', document.getElementById('hours-${course.id}').value)">销课</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            ${historyHtml}
        `;

        panel.classList.remove('hidden');
    }

    // 快速销课
    quickDeduct(studentId, courseName, hours) {
        const result = this.deductHours(studentId, courseName, parseInt(hours));
        if (result.success) {
            alert(result.message);
            this.showStudentDetail(studentId);
            this.renderStudents();
        } else {
            alert(result.message);
        }
    }

    // 删除学生
    deleteStudent(studentId) {
        if (confirm('确定要删除该学生吗？')) {
            this.students = this.students.filter(s => s.id !== studentId);
            this.saveData();
            this.closeDetail();
            this.renderStudents();
        }
    }

    // 关闭详情面板
    closeDetail() {
        document.getElementById('studentDetailPanel').classList.add('hidden');
    }

    // 更新统计信息
    updateStats() {
        const stats = this.getStats();
        document.getElementById('totalStudents').textContent = stats.totalStudents;
        document.getElementById('monthlyDeductions').textContent = stats.monthlyDeductions;
        document.getElementById('todayDeductions').textContent = stats.todayDeductions;
    }
}

// 初始化
let crm;

document.addEventListener('DOMContentLoaded', () => {
    crm = new StudentCRM();

    // 语音销课按钮
    document.getElementById('voiceBtn').addEventListener('click', () => {
        document.getElementById('voicePanel').classList.remove('hidden');
        document.getElementById('voiceInput').focus();
    });

    document.getElementById('closeVoiceBtn').addEventListener('click', () => {
        document.getElementById('voicePanel').classList.add('hidden');
        document.getElementById('voiceResult').innerHTML = '';
    });

    // 处理语音输入
    document.getElementById('processVoiceBtn').addEventListener('click', () => {
        const input = document.getElementById('voiceInput').value.trim();
        if (!input) {
            alert('请输入销课命令');
            return;
        }

        const result = crm.executeVoiceCommand(input);
        const resultDiv = document.getElementById('voiceResult');

        if (result.success) {
            resultDiv.className = 'voice-result success';
            resultDiv.innerHTML = `
                <div style="font-size: 18px; margin-bottom: 10px;">✅ 销课成功</div>
                <div><strong>${result.message}</strong></div>
            `;
        } else {
            resultDiv.className = 'voice-result error';
            resultDiv.innerHTML = `
                <div style="font-size: 18px; margin-bottom: 10px;">❌ 销课失败</div>
                <div>${result.message}</div>
            `;
        }

        document.getElementById('voiceInput').value = '';
        crm.renderStudents();
        setTimeout(() => {
            document.getElementById('voicePanel').classList.add('hidden');
            resultDiv.innerHTML = '';
        }, 2000);
    });

    // 回车快速提交
    document.getElementById('voiceInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('processVoiceBtn').click();
        }
    });

    // 添加学生
    document.getElementById('addStudentBtn').addEventListener('click', () => {
        console.log('点击了添加学生按钮');
        document.getElementById('addStudentPanel').classList.remove('hidden');
    });

    document.getElementById('cancelAddBtn').addEventListener('click', () => {
        document.getElementById('addStudentPanel').classList.add('hidden');
    });

    // 添加课程包
    document.getElementById('addCourseBtn').addEventListener('click', (e) => {
        e.preventDefault();
        const container = document.getElementById('coursePackages');
        const newCourse = document.createElement('div');
        newCourse.className = 'course-package';
        newCourse.innerHTML = `
            <input type="text" placeholder="课程名称" class="course-name">
            <input type="number" placeholder="课时数" class="course-hours" min="0">
            <button type="button" class="remove-course btn-danger">删除</button>
        `;
        container.appendChild(newCourse);

        newCourse.querySelector('.remove-course').addEventListener('click', () => {
            newCourse.remove();
        });
    });

    // 删除课程包
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-course')) {
            e.target.parentElement.remove();
        }
    });

    // 提交添加学生表单
    document.getElementById('addStudentForm').addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('studentName').value.trim();
        const phone = document.getElementById('studentPhone').value.trim();
        const notes = document.getElementById('studentNotes').value.trim();

        const courses = [];
        document.querySelectorAll('.course-package').forEach(pkg => {
            const courseName = pkg.querySelector('.course-name').value.trim();
            const hours = parseInt(pkg.querySelector('.course-hours').value) || 0;
            if (courseName && hours > 0) {
                courses.push({ name: courseName, hours });
            }
        });

        if (!name) {
            alert('请输入学生姓名');
            return;
        }

        if (courses.length === 0) {
            alert('请至少添加一个课程包');
            return;
        }

        crm.addStudent(name, phone, courses, notes);
        alert('✅ 学生添加成功');

        document.getElementById('addStudentForm').reset();
        document.getElementById('coursePackages').innerHTML = `
            <div class="course-package">
                <input type="text" placeholder="课程名称" class="course-name">
                <input type="number" placeholder="课时数" class="course-hours" min="0">
                <button type="button" class="remove-course btn-danger">删除</button>
            </div>
        `;
        document.getElementById('addStudentPanel').classList.add('hidden');
        crm.renderStudents();
    });

    // 搜索功能
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const keyword = e.target.value;
        const filter = document.getElementById('filterSelect').value;
        crm.renderStudents(keyword, filter);
    });

    document.getElementById('filterSelect').addEventListener('change', (e) => {
        const keyword = document.getElementById('searchInput').value;
        crm.renderStudents(keyword, e.target.value);
    });

    // 演示数据
    if (crm.students.length === 0) {
        crm.addStudent('张三', '13800138000', [
            { name: '数学', hours: 10 },
            { name: '英语', hours: 8 }
        ], '优秀学生');

        crm.addStudent('李四', '13900139000', [
            { name: '物理', hours: 5 },
            { name: '化学', hours: 6 }
        ], '需要加强');

        crm.addStudent('王五', '14000140000', [
            { name: '语文', hours: 12 }
        ], '');

        crm.renderStudents();
    }
});
