# 🎯 快速参考

## 语音销课命令示例

### 销课命令
```
张三销2节数学课
李四扣1节英语课
王五上了一次物理课
赵六销3节语文课
```

### 增加课时命令
```
张三增加2节数学课
李四加1节英语课
王五增加5节物理课
```

## 系统命令

| 操作 | 步骤 |
|------|------|
| **启动系统** | `bash start.sh` 或直接打开 `index.html` |
| **添加学生** | 点击 "➕ 添加学生" 按钮 |
| **语音销课** | 点击 "🎤 语音销课" 按钮 |
| **查看详情** | 点击学生卡片 |
| **快速销课** | 在详情页面选择课程和节数 |
| **搜索学生** | 在搜索框输入学生名字 |
| **筛选学生** | 使用下拉菜单筛选 |

## 数据位置

- **项目目录**: `~/.qclaw/workspace/crm-student/`
- **数据存储**: 浏览器 LocalStorage（自动保存）
- **文件列表**:
  - `index.html` - 主页面
  - `style.css` - 样式
  - `app.js` - 逻辑
  - `start.sh` - 启动脚本
  - `README.md` - 完整文档

## 浏览器访问

### 方式1：直接打开文件
```bash
open ~/.qclaw/workspace/crm-student/index.html
```

### 方式2：启动服务器
```bash
cd ~/.qclaw/workspace/crm-student
python3 -m http.server 8000
# 访问 http://localhost:8000
```

### 方式3：使用启动脚本
```bash
bash ~/.qclaw/workspace/crm-student/start.sh
# 访问 http://localhost:8000
```

## 常见问题

**Q: 数据会丢失吗？**
A: 不会。数据保存在浏览器 LocalStorage，关闭浏览器后仍然保留。

**Q: 如何备份数据？**
A: 在浏览器控制台运行 `console.log(JSON.stringify(crm.students, null, 2))` 复制数据。

**Q: 支持多用户吗？**
A: 当前版本不支持，所有用户共享同一个数据库。

**Q: 可以在手机上使用吗？**
A: 可以。系统完全响应式，支持所有设备。

---

**祝你使用愉快！** 🎉
