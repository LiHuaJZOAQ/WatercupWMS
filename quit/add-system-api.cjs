const fs = require('fs');
const path = './server/index.js';
let code = fs.readFileSync(path, 'utf8');

const insertPos = code.indexOf('// ====================================\n// 入库接口 - 完整版本');

const systemApis = `
// ====================================
// 系统设置 - 用户管理接口
// ====================================

app.get('/api/users', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, status } = req.query;
    let whereConditions = [];
    let queryParams = [];

    if (keyword) {
      whereConditions.push('(Username LIKE ? OR FullName LIKE ? OR Email LIKE ?)');
      queryParams.push(\`%\${keyword}%\`, \`%\${keyword}%\`, \`%\${keyword}%\`);
    }
    if (status !== undefined && status !== '') {
      whereConditions.push('IsActive = ?');
      queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    const countSql = \`SELECT COUNT(*) as total FROM User \${whereClause}\`;
    const countResult = await executeQuery(countSql, queryParams);
    const total = countResult[0].total;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;
    
    const sql = \`
      SELECT 
        UserID as id, Username as username, Email as email, FullName as fullName,
        Phone as phone, Department as department, Position as position,
        IsActive as isActive, LastLoginTime as lastLoginTime, CreatedAt as createdAt
      FROM User \${whereClause} ORDER BY UserID DESC LIMIT ? OFFSET ?
    \`;
    const results = await executeQuery(sql, [...queryParams, limit, offset]);

    // 获取角色信息
    for (let user of results) {
      const roleSql = \`
        SELECT r.RoleID as roleId, r.RoleName as roleName
        FROM UserRole ur
        JOIN Role r ON ur.RoleID = r.RoleID
        WHERE ur.UserID = ?
      \`;
      const roles = await executeQuery(roleSql, [user.id]);
      user.roles = roles;
      user.roleIds = roles.map(r => r.roleId);
      user.createdAt = formatDateTime(user.createdAt);
      user.lastLoginTime = user.lastLoginTime ? formatDateTime(user.lastLoginTime) : null;
    }

    res.json(successResponse({ items: results, total, page: parseInt(page), pageSize: limit }));
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json(errorResponse('获取用户列表失败'));
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { username, password, email, fullName, phone, department, position, isActive = 1, roleIds = [] } = req.body;
    const validation = validateRequired({ username, password }, ['username', 'password']);
    if (validation) return res.status(400).json(errorResponse(validation, 400));

    const checkResult = await executeQuery('SELECT UserID FROM User WHERE Username = ?', [username]);
    if (checkResult.length > 0) return res.status(400).json(errorResponse('用户名已存在', 400));

    // 使用简单的明文存储作为示例 (实际应使用 bcrypt 加密)
    const passwordHash = password; 

    const insertResult = await executeQuery(
      \`INSERT INTO User (Username, PasswordHash, Email, FullName, Phone, Department, Position, IsActive, CreatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())\`,
      [username, passwordHash, email || null, fullName || '', phone || '', department || '', position || '', isActive]
    );

    const userId = insertResult.insertId;

    if (roleIds && roleIds.length > 0) {
      for (const roleId of roleIds) {
        await executeQuery('INSERT INTO UserRole (UserID, RoleID) VALUES (?, ?)', [userId, roleId]);
      }
    }

    res.json(successResponse(null, '用户创建成功'));
  } catch (error) {
    console.error('创建用户失败:', error);
    res.status(500).json(errorResponse('创建用户失败'));
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, fullName, phone, department, position, isActive, roleIds } = req.body;

    await executeQuery(
      \`UPDATE User SET Email = ?, FullName = ?, Phone = ?, Department = ?, Position = ?, IsActive = ?, UpdatedAt = NOW() WHERE UserID = ?\`,
      [email || null, fullName || '', phone || '', department || '', position || '', isActive !== undefined ? isActive : 1, id]
    );

    if (roleIds !== undefined) {
      await executeQuery('DELETE FROM UserRole WHERE UserID = ?', [id]);
      if (roleIds.length > 0) {
        for (const roleId of roleIds) {
          await executeQuery('INSERT INTO UserRole (UserID, RoleID) VALUES (?, ?)', [id, roleId]);
        }
      }
    }

    res.json(successResponse(null, '用户更新成功'));
  } catch (error) {
    res.status(500).json(errorResponse('更新用户失败'));
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (id == 1) return res.status(400).json(errorResponse('系统默认管理员无法删除', 400));
    await executeQuery('DELETE FROM User WHERE UserID = ?', [id]);
    res.json(successResponse(null, '用户删除成功'));
  } catch (error) {
    res.status(500).json(errorResponse('删除用户失败'));
  }
});

// ====================================
// 系统设置 - 角色与权限接口
// ====================================

app.get('/api/roles', async (req, res) => {
  try {
    const sql = 'SELECT RoleID as id, RoleName as name, Description as description, IsSystem as isSystem, CreatedAt as createdAt FROM Role ORDER BY RoleID ASC';
    const results = await executeQuery(sql);
    
    for (let role of results) {
      const permSql = \`
        SELECT p.PermissionID as permissionId, p.PermissionCode as code, p.PermissionName as name
        FROM RolePermission rp
        JOIN Permission p ON rp.PermissionID = p.PermissionID
        WHERE rp.RoleID = ?
      \`;
      const perms = await executeQuery(permSql, [role.id]);
      role.permissions = perms;
      role.permissionIds = perms.map(p => p.permissionId);
      role.createdAt = formatDateTime(role.createdAt);
    }
    
    res.json(successResponse({ items: results }));
  } catch (error) {
    res.status(500).json(errorResponse('获取角色列表失败'));
  }
});

app.post('/api/roles', async (req, res) => {
  try {
    const { name, description, permissionIds = [] } = req.body;
    const validation = validateRequired({ name }, ['name']);
    if (validation) return res.status(400).json(errorResponse(validation, 400));

    const checkResult = await executeQuery('SELECT RoleID FROM Role WHERE RoleName = ?', [name]);
    if (checkResult.length > 0) return res.status(400).json(errorResponse('角色名称已存在', 400));

    const insertResult = await executeQuery(
      'INSERT INTO Role (RoleName, Description, IsSystem, CreatedAt) VALUES (?, ?, 0, NOW())',
      [name, description || '']
    );

    const roleId = insertResult.insertId;
    for (const permId of permissionIds) {
      await executeQuery('INSERT INTO RolePermission (RoleID, PermissionID) VALUES (?, ?)', [roleId, permId]);
    }

    res.json(successResponse(null, '角色创建成功'));
  } catch (error) {
    res.status(500).json(errorResponse('创建角色失败'));
  }
});

app.put('/api/roles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissionIds } = req.body;
    
    const checkRole = await executeQuery('SELECT IsSystem FROM Role WHERE RoleID = ?', [id]);
    if (checkRole.length === 0) return res.status(404).json(errorResponse('角色不存在', 404));
    if (checkRole[0].IsSystem === 1) return res.status(400).json(errorResponse('系统内置角色无法修改', 400));

    await executeQuery('UPDATE Role SET RoleName = ?, Description = ? WHERE RoleID = ?', [name, description || '', id]);

    if (permissionIds !== undefined) {
      await executeQuery('DELETE FROM RolePermission WHERE RoleID = ?', [id]);
      for (const permId of permissionIds) {
        await executeQuery('INSERT INTO RolePermission (RoleID, PermissionID) VALUES (?, ?)', [id, permId]);
      }
    }

    res.json(successResponse(null, '角色更新成功'));
  } catch (error) {
    res.status(500).json(errorResponse('更新角色失败'));
  }
});

app.delete('/api/roles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const checkRole = await executeQuery('SELECT IsSystem FROM Role WHERE RoleID = ?', [id]);
    if (checkRole.length === 0) return res.status(404).json(errorResponse('角色不存在', 404));
    if (checkRole[0].IsSystem === 1) return res.status(400).json(errorResponse('系统内置角色无法删除', 400));

    await executeQuery('DELETE FROM Role WHERE RoleID = ?', [id]);
    res.json(successResponse(null, '角色删除成功'));
  } catch (error) {
    res.status(500).json(errorResponse('删除角色失败'));
  }
});

app.get('/api/permissions', async (req, res) => {
  try {
    const sql = 'SELECT PermissionID as id, PermissionCode as code, PermissionName as name, ModuleName as module, ParentID as parentId FROM Permission ORDER BY ParentID ASC, SortOrder ASC';
    const results = await executeQuery(sql);
    
    // 转换为树形结构
    const map = {};
    const tree = [];
    results.forEach(item => { map[item.id] = { ...item, children: [] }; });
    results.forEach(item => {
      if (item.parentId) {
        if (map[item.parentId]) map[item.parentId].children.push(map[item.id]);
      } else {
        tree.push(map[item.id]);
      }
    });

    res.json(successResponse({ items: tree, flatList: results }));
  } catch (error) {
    res.status(500).json(errorResponse('获取权限列表失败'));
  }
});

// ====================================
// 系统设置 - 操作日志接口
// ====================================

app.get('/api/operation-logs', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, username, operationType, moduleName, startDate, endDate } = req.query;
    let whereConditions = [];
    let queryParams = [];

    if (username) {
      whereConditions.push('Username LIKE ?');
      queryParams.push(\`%\${username}%\`);
    }
    if (operationType) {
      whereConditions.push('OperationType = ?');
      queryParams.push(operationType);
    }
    if (moduleName) {
      whereConditions.push('ModuleName LIKE ?');
      queryParams.push(\`%\${moduleName}%\`);
    }
    if (startDate) {
      whereConditions.push('OperationTime >= ?');
      queryParams.push(startDate);
    }
    if (endDate) {
      whereConditions.push('OperationTime <= ?');
      queryParams.push(endDate);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    const countSql = \`SELECT COUNT(*) as total FROM OperationLog \${whereClause}\`;
    const countResult = await executeQuery(countSql, queryParams);
    const total = countResult[0].total;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;
    
    const sql = \`
      SELECT 
        LogID as id, Username as username, OperationType as operationType,
        ModuleName as moduleName, FunctionName as functionName, RequestMethod as method,
        RequestUrl as url, IpAddress as ip, OperationTime as operationTime, Status as status
      FROM OperationLog \${whereClause} ORDER BY OperationTime DESC LIMIT ? OFFSET ?
    \`;
    const results = await executeQuery(sql, [...queryParams, limit, offset]);
    
    const formattedResults = results.map(item => ({ ...item, operationTime: formatDateTime(item.operationTime) }));

    res.json(successResponse({ items: formattedResults, total, page: parseInt(page), pageSize: limit }));
  } catch (error) {
    res.status(500).json(errorResponse('获取操作日志失败'));
  }
});

`;

if (insertPos !== -1) {
  code = code.substring(0, insertPos) + systemApis + code.substring(insertPos);
  fs.writeFileSync(path, code);
  console.log('System APIs injected!');
} else {
  console.log('Insert position not found');
}
