import express from 'express';

const router = express.Router();

// ---------------------------------------------------------------------------
// Prisma Creator Network — datos mock en memoria (F0/F2).
// Cuentas, proyectos ocultos, códigos de canje y gestión de testers.
// ---------------------------------------------------------------------------

const users = [
    { id: 1, username: 'dev', password: 'dev123', displayName: 'Prisma Dev', role: 'developer', activated: true },
    { id: 2, username: 'tester', password: 'tester123', displayName: 'Tester Uno', role: 'tester', activated: true },
    { id: 3, username: 'user', password: 'user123', displayName: 'Miembro Común', role: 'member', activated: false },
    { id: 4, username: 'tester2', password: 'tester123', displayName: 'Tester Dos', role: 'member', activated: true }
];

const projects = [
    {
        id: 'prj-1',
        creatorId: 1,
        name: 'Proyecto Prisma: Testeo',
        description: 'Proyecto oculto de prueba para el flujo de códigos de la Creator Network.',
        category: 'Total Conversion',
        cover: 'https://placehold.co/700x1024',
        tags: ['prisma', 'testeo'],
        version: '0.9.0',
        executablePath: null,
        link: null,
        statsIni: null,
        visibility: 'hidden', // draft | hidden | published
        testers: [2],
        codes: [
            { code: 'PRISMA-TEST', maxUses: 100, used: 1, expiresAt: null, active: true }
        ],
        createdAt: '2026-11-19T12:00:00.000Z',
        updatedAt: '2026-11-19T12:00:00.000Z'
    }
];

// Grupos de desarrollo (mock en memoria). Cualquier cuenta puede crear uno.
const groups = [
    {
        id: 'grp-1',
        name: 'Prisma Studios',
        handle: 'prisma-studios',
        ownerId: 1,
        members: [1, 4],
        inviteCode: 'GRP-PRISMA01',
        createdAt: '2026-11-20T12:00:00.000Z'
    },
    {
        id: 'grp-2',
        name: 'Nebula Works',
        handle: 'nebula-works',
        ownerId: 4,
        members: [4, 2],
        inviteCode: 'GRP-NEBULA01',
        createdAt: '2026-11-21T12:00:00.000Z'
    }
];

// Invitaciones pendientes (por ahora sólo a grupos de desarrollo).
const requests = [
    {
        id: 'req-1',
        type: 'group_invite',
        groupId: 'grp-2',
        userId: 1,
        invitedBy: 4,
        status: 'pending',
        createdAt: '2026-11-21T12:00:00.000Z'
    }
];

const VISIBILITIES = ['draft', 'hidden', 'published'];

// Lista curada de idiomas para el form (el usuario solo elige, no escribe)
const LANGUAGES = [
    'Español', 'English', 'Português', 'Français', 'Deutsch', 'Italiano',
    'Nederlands', 'Русский', 'Українська', 'Polski', 'Türkçe', 'Svenska',
    'Norsk', 'Dansk', 'Suomi', 'Íslenska', 'Čeština', 'Slovenčina',
    'Magyar', 'Română', 'Български', 'Ελληνικά', 'Srpski', 'Hrvatski',
    'Slovenščina', 'Lietuvių', 'Latviešu', 'Eesti', '日本語', '中文 (简体)',
    '한국어', 'العربية', 'فارسی', 'עברית', 'हिन्दी', 'বাংলা',
    'ไทย', 'Tiếng Việt', 'Bahasa Indonesia', 'Bahasa Melayu', 'Filipino',
    'Català', 'Galego', 'Euskara', 'Gaeilge', 'Cymraeg', 'Gàidhlig',
    'Esperanto'
];

function publicUser(user) {
    const { password, ...rest } = user;
    return rest;
}

function creatorName(project) {
    const creator = users.find((user) => user.id === project.creatorId);
    return creator ? creator.displayName : null;
}

function findGroup(id) {
    return groups.find((group) => group.id === id);
}

function isGroupMember(group, userId) {
    return Boolean(group) && (group.ownerId === userId || group.members.includes(userId));
}

function publisherName(project) {
    if (project.publishAs && project.publishAs !== 'self') {
        const group = findGroup(project.publishAs);
        if (group) {
            return group.name;
        }
    }
    return creatorName(project);
}

function mapGroup(group) {
    return {
        id: group.id,
        name: group.name,
        handle: group.handle,
        inviteCode: group.inviteCode,
        ownerId: group.ownerId,
        owner: publicUser(users.find((user) => user.id === group.ownerId) || {}),
        members: group.members
            .map((id) => users.find((user) => user.id === id))
            .filter(Boolean)
            .map(publicUser),
        memberCount: group.members.length,
        createdAt: group.createdAt
    };
}

function mapRequest(request) {
    const group = findGroup(request.groupId);
    const invitedBy = users.find((user) => user.id === request.invitedBy);

    return {
        id: request.id,
        type: request.type,
        status: request.status,
        groupId: request.groupId,
        groupName: group ? group.name : null,
        invitedBy: invitedBy ? publicUser(invitedBy) : null,
        memberCount: group ? group.members.length : 0,
        createdAt: request.createdAt
    };
}

function slugify(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48);
}

function uniqueHandle(name) {
    const base = slugify(name) || 'grupo';
    let handle = base;
    let suffix = 2;
    while (groups.some((group) => group.handle === handle)) {
        handle = `${base}-${suffix}`;
        suffix += 1;
    }
    return handle;
}

function generateGroupCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let token = '';
    for (let i = 0; i < 8; i += 1) {
        token += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return `GRP-${token}`;
}

function findProject(id) {
    return projects.find((project) => project.id === id);
}

function generateCode(maxUses) {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let token = '';
    for (let i = 0; i < 8; i += 1) {
        token += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return {
        code: `PCN-${token}`,
        maxUses,
        used: 0,
        expiresAt: null,
        active: true
    };
}

function mapProject(project) {
    return {
        id: project.id,
        name: project.name,
        description: project.description,
        category: project.category,
        cover: project.cover,
        tags: project.tags,
        version: project.version,
        executablePath: project.executablePath,
        link: project.link,
        downloadMain: project.downloadMain || null,
        downloadUpdate: project.downloadUpdate || null,
        statsIni: project.statsIni,
        releasedate: project.releasedate || null,
        countdownBadge: Boolean(project.countdownBadge),
        credits: project.credits || '',
        links: Array.isArray(project.links) ? project.links : [],
        requirements: project.requirements || '',
        changelog: project.changelog || '',
        languages: Array.isArray(project.languages)
            ? project.languages
            : (typeof project.languages === 'string' && project.languages ? [project.languages] : []),
        assets: project.assets || {},
        screenshots: normalizeScreenshots(project.screenshots),
        visibility: project.visibility,
        creatorName: creatorName(project),
        publishAs: project.publishAs || 'self',
        publisherName: publisherName(project),
        testers: project.testers
            .map((id) => users.find((user) => user.id === id))
            .filter(Boolean)
            .map(publicUser),
        codes: project.codes.map((entryCode) => ({
            code: entryCode.code,
            maxUses: entryCode.maxUses,
            used: entryCode.used,
            expiresAt: entryCode.expiresAt,
            active: entryCode.active
        })),
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
    };
}

function touch(project) {
    project.updatedAt = new Date().toISOString();
}

function normalizeAssets(assets) {
    const source = assets && typeof assets === 'object' ? assets : {};
    return {
        banner: typeof source.banner === 'string' ? source.banner : null,
        icon: typeof source.icon === 'string' ? source.icon : null,
        logo: typeof source.logo === 'string' ? source.logo : null,
        libraryImage: typeof source.libraryImage === 'string' ? source.libraryImage : null,
        hoverImage: typeof source.hoverImage === 'string' ? source.hoverImage : null,
        hoverMusic: typeof source.hoverMusic === 'string' ? source.hoverMusic : null,
        trailer: typeof source.trailer === 'string' ? source.trailer : null
    };
}

function normalizeLanguages(list) {
    if (!Array.isArray(list)) {
        return [];
    }
    const seen = new Set();
    const result = [];
    list.forEach((entry) => {
        if (typeof entry !== 'string') {
            return;
        }
        const value = entry.trim();
        const key = value.toLowerCase();
        if (!value || seen.has(key)) {
            return;
        }
        seen.add(key);
        result.push(value);
    });
    return result;
}

function normalizeScreenshots(list) {
    if (!Array.isArray(list)) {
        return [];
    }
    return list
        .map((entry) => {
            if (typeof entry === 'string') {
                return { src: entry, name: '', description: '' };
            }
            if (entry && typeof entry.src === 'string') {
                return {
                    src: entry.src,
                    name: typeof entry.name === 'string' ? entry.name : '',
                    description: typeof entry.description === 'string' ? entry.description : ''
                };
            }
            return null;
        })
        .filter(Boolean);
}

// POST /api/auth/login — mock: usuario + contraseña en claro en memoria
router.post('/auth/login', (req, res) => {
    const { username, password } = req.body || {};

    if (typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'missing_fields' });
    }

    const user = users.find(
        (entry) => entry.username === username.trim() && entry.password === password
    );

    if (!user) {
        return res.status(401).json({ error: 'invalid' });
    }

    res.json({ user: publicUser(user) });
});

// GET /api/users — usuarios (para asignar testers en F2)
router.get('/users', (req, res) => {
    res.json(users.map(publicUser));
});

// GET /api/languages — lista curada de idiomas para el form
router.get('/languages', (req, res) => {
    res.json([...LANGUAGES].sort((a, b) => a.localeCompare(b, 'es')));
});

// POST /api/codes/redeem — valida un código de activación y devuelve el proyecto
router.post('/codes/redeem', (req, res) => {
    const { code } = req.body || {};

    if (typeof code !== 'string' || !code.trim()) {
        return res.status(400).json({ error: 'missing_code' });
    }

    const normalized = code.trim().toUpperCase();
    const project = projects.find((entry) =>
        entry.codes.some((entryCode) => entryCode.code === normalized)
    );

    if (!project) {
        return res.status(404).json({ error: 'invalid' });
    }

    const projectCode = project.codes.find((entryCode) => entryCode.code === normalized);

    if (!projectCode.active) {
        return res.status(400).json({ error: 'inactive' });
    }

    if (projectCode.expiresAt && new Date(projectCode.expiresAt).getTime() < Date.now()) {
        return res.status(400).json({ error: 'expired' });
    }

    if (projectCode.used >= projectCode.maxUses) {
        return res.status(400).json({ error: 'limit' });
    }

    projectCode.used += 1;
    touch(project);

    res.json({
        project: {
            id: project.id,
            name: project.name,
            description: project.description,
            category: project.category,
            cover: project.cover,
            tags: project.tags,
            version: project.version,
            executablePath: project.executablePath,
            link: project.link,
            creatorName: creatorName(project),
            visibility: project.visibility
        },
        remainingUses: Math.max(0, projectCode.maxUses - projectCode.used)
    });
});

// GET /api/creator/projects — proyectos (opcional ?creator=username)
router.get('/creator/projects', (req, res) => {
    const { creator } = req.query;
    let list = projects;

    if (creator) {
        const user = users.find((entry) => entry.username === creator);
        if (!user) {
            return res.json([]);
        }
        list = projects.filter((project) => project.creatorId === user.id);
    }

    res.json(list.map(mapProject));
});

// POST /api/creator/projects — crear proyecto (opcionalmente con código inicial)
router.post('/creator/projects', (req, res) => {
    const body = req.body || {};
    const { creator } = body;

    if (typeof creator !== 'string' || typeof body.name !== 'string' || !body.name.trim()) {
        return res.status(400).json({ error: 'missing_fields' });
    }

    const user = users.find((entry) => entry.username === creator.trim());
    if (!user) {
        return res.status(401).json({ error: 'unknown_creator' });
    }

    const now = new Date().toISOString();
    const project = {
        id: `prj-${Date.now()}`,
        creatorId: user.id,
        name: body.name.trim(),
        description: typeof body.description === 'string' ? body.description : '',
        category: body.category || 'Otro',
        cover: body.cover || null,
        tags: Array.isArray(body.tags) ? body.tags : [],
        version: typeof body.version === 'string' && body.version.trim() ? body.version.trim() : '0.1.0',
        executablePath: body.executablePath || null,
        link: null,
        downloadMain: typeof body.downloadMain === 'string' && body.downloadMain.trim() ? body.downloadMain.trim() : null,
        downloadUpdate: typeof body.downloadUpdate === 'string' && body.downloadUpdate.trim() ? body.downloadUpdate.trim() : null,
        statsIni: body.statsIni || null,
        releasedate: typeof body.releasedate === 'string' ? body.releasedate : null,
        countdownBadge: Boolean(body.countdownBadge),
        credits: typeof body.credits === 'string' ? body.credits : '',
        links: Array.isArray(body.links) ? body.links.filter((entry) => typeof entry === 'string') : [],
        requirements: typeof body.requirements === 'string' ? body.requirements : '',
        changelog: typeof body.changelog === 'string' ? body.changelog : '',
        languages: normalizeLanguages(body.languages),
        assets: normalizeAssets(body.assets),
        screenshots: normalizeScreenshots(body.screenshots),
        visibility: 'hidden', // los proyectos siempre nacen ocultos
        publishAs: 'self',
        testers: [],
        codes: [],
        createdAt: now,
        updatedAt: now
    };

    const maxUses = Number(body.generateCodeMaxUses);
    if (Number.isFinite(maxUses) && maxUses >= 1) {
        project.codes.push(generateCode(Math.floor(maxUses)));
    }

    if (body.publishAs !== undefined && body.publishAs !== null) {
        if (body.publishAs !== 'self') {
            const group = findGroup(body.publishAs);
            if (!group || !isGroupMember(group, user.id)) {
                return res.status(400).json({ error: 'invalid_publish_as' });
            }
            project.publishAs = group.id;
        }
    }

    projects.push(project);
    res.status(201).json({ project: mapProject(project) });
});

// PATCH /api/creator/projects/:id — actualizar metadatos
router.patch('/creator/projects/:id', (req, res) => {
    const project = findProject(req.params.id);
    if (!project) {
        return res.status(404).json({ error: 'not_found' });
    }

    const body = req.body || {};

    if (body.name !== undefined && (typeof body.name !== 'string' || !body.name.trim())) {
        return res.status(400).json({ error: 'missing_fields' });
    }

    ['name', 'description', 'category', 'cover', 'version', 'executablePath', 'statsIni', 'releasedate', 'credits', 'requirements', 'changelog', 'languages', 'downloadMain', 'downloadUpdate'].forEach((field) => {
        if (body[field] !== undefined) {
            project[field] = body[field];
        }
    });

    if (body.countdownBadge !== undefined) {
        project.countdownBadge = Boolean(body.countdownBadge);
    }
    if (Array.isArray(body.tags)) {
        project.tags = body.tags;
    }
    if (Array.isArray(body.links)) {
        project.links = body.links.filter((entry) => typeof entry === 'string');
    }
    if (Array.isArray(body.languages)) {
        project.languages = normalizeLanguages(body.languages);
    }
    if (body.screenshots !== undefined) {
        project.screenshots = normalizeScreenshots(body.screenshots);
    }
    if (body.assets !== undefined) {
        project.assets = normalizeAssets(body.assets);
    }
    if (body.publishAs !== undefined && body.publishAs !== null) {
        if (body.publishAs === 'self') {
            project.publishAs = 'self';
        } else {
            const group = findGroup(body.publishAs);
            if (!group || !isGroupMember(group, project.creatorId)) {
                return res.status(400).json({ error: 'invalid_publish_as' });
            }
            project.publishAs = group.id;
        }
    }
    if (typeof project.name === 'string') {
        project.name = project.name.trim();
    }

    touch(project);
    res.json({ project: mapProject(project) });
});

// POST /api/creator/projects/:id/visibility — publicar / ocultar / borrador
router.post('/creator/projects/:id/visibility', (req, res) => {
    const project = findProject(req.params.id);
    if (!project) {
        return res.status(404).json({ error: 'not_found' });
    }

    const { visibility } = req.body || {};
    if (!VISIBILITIES.includes(visibility)) {
        return res.status(400).json({ error: 'invalid_visibility' });
    }

    project.visibility = visibility;
    touch(project);
    res.json({ project: mapProject(project) });
});

// POST /api/creator/projects/:id/codes — generar código de activación
router.post('/creator/projects/:id/codes', (req, res) => {
    const project = findProject(req.params.id);
    if (!project) {
        return res.status(404).json({ error: 'not_found' });
    }

    const maxUses = Number((req.body || {}).maxUses);
    if (!Number.isFinite(maxUses) || maxUses < 1 || maxUses > 100000) {
        return res.status(400).json({ error: 'invalid_max_uses' });
    }

    const newCode = generateCode(Math.floor(maxUses));
    project.codes.push(newCode);
    touch(project);
    res.status(201).json({ code: newCode });
});

// POST /api/creator/projects/:id/testers — asignar/quitar tester
router.post('/creator/projects/:id/testers', (req, res) => {
    const project = findProject(req.params.id);
    if (!project) {
        return res.status(404).json({ error: 'not_found' });
    }

    const { userId, action } = req.body || {};
    const user = users.find((entry) => entry.id === Number(userId));
    if (!user) {
        return res.status(404).json({ error: 'user_not_found' });
    }

    if (action === 'add') {
        if (!user.activated) {
            return res.status(400).json({ error: 'not_activated' });
        }
        if (!project.testers.includes(user.id)) {
            project.testers.push(user.id);
        }
    } else if (action === 'remove') {
        project.testers = project.testers.filter((id) => id !== user.id);
    } else {
        return res.status(400).json({ error: 'invalid_action' });
    }

    touch(project);
    res.json({ project: mapProject(project) });
});

// ---------------------------------------------------------------------------
// Grupos de desarrollo
// ---------------------------------------------------------------------------

// GET /api/creator/groups?creator=username — grupos del usuario
router.get('/creator/groups', (req, res) => {
    const { creator } = req.query;
    const user = users.find((entry) => entry.username === creator);

    if (!user) {
        return res.json([]);
    }

    res.json(
        groups
            .filter((group) => isGroupMember(group, user.id))
            .map(mapGroup)
    );
});

// POST /api/creator/groups — crear grupo (el creador queda como dueño y miembro)
router.post('/creator/groups', (req, res) => {
    const body = req.body || {};

    if (typeof body.creator !== 'string' || typeof body.name !== 'string' || !body.name.trim()) {
        return res.status(400).json({ error: 'missing_fields' });
    }

    const user = users.find((entry) => entry.username === body.creator.trim());
    if (!user) {
        return res.status(401).json({ error: 'unknown_creator' });
    }

    const name = body.name.trim().slice(0, 80);
    const group = {
        id: `grp-${Date.now()}`,
        name,
        handle: uniqueHandle(name),
        ownerId: user.id,
        members: [user.id],
        inviteCode: generateGroupCode(),
        createdAt: new Date().toISOString()
    };

    groups.push(group);
    res.status(201).json({ group: mapGroup(group) });
});

// POST /api/creator/groups/join — unirse con el código de invitación
router.post('/creator/groups/join', (req, res) => {
    const { creator, code } = req.body || {};

    if (typeof creator !== 'string' || typeof code !== 'string' || !code.trim()) {
        return res.status(400).json({ error: 'missing_fields' });
    }

    const user = users.find((entry) => entry.username === creator.trim());
    if (!user) {
        return res.status(401).json({ error: 'unknown_creator' });
    }

    const normalized = code.trim().toUpperCase();
    const group = groups.find((entry) => entry.inviteCode === normalized);

    if (!group) {
        return res.status(404).json({ error: 'invalid_group_code' });
    }

    if (group.members.includes(user.id)) {
        return res.status(400).json({ error: 'already_member' });
    }

    group.members.push(user.id);
    res.json({ group: mapGroup(group) });
});

// POST /api/creator/groups/:id/invite — invitar a un usuario (sólo el dueño)
router.post('/creator/groups/:id/invite', (req, res) => {
    const group = findGroup(req.params.id);
    if (!group) {
        return res.status(404).json({ error: 'group_not_found' });
    }

    const { creator, userId } = req.body || {};
    const sender = users.find((entry) => entry.username === creator);

    if (!sender || sender.id !== group.ownerId) {
        return res.status(403).json({ error: 'forbidden' });
    }

    const target = users.find((entry) => entry.id === Number(userId));
    if (!target) {
        return res.status(404).json({ error: 'user_not_found' });
    }

    if (group.members.includes(target.id)) {
        return res.status(400).json({ error: 'already_member' });
    }

    const existing = requests.find(
        (entry) => entry.status === 'pending' && entry.groupId === group.id && entry.userId === target.id
    );
    if (existing) {
        return res.status(400).json({ error: 'already_invited' });
    }

    const request = {
        id: `req-${Date.now()}`,
        type: 'group_invite',
        groupId: group.id,
        userId: target.id,
        invitedBy: sender.id,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    requests.push(request);
    res.status(201).json({ request: mapRequest(request) });
});

// POST /api/creator/groups/:id/leave — salir del grupo (el dueño no puede)
router.post('/creator/groups/:id/leave', (req, res) => {
    const group = findGroup(req.params.id);
    if (!group) {
        return res.status(404).json({ error: 'group_not_found' });
    }

    const user = users.find((entry) => entry.username === (req.body || {}).creator);
    if (!user || !group.members.includes(user.id)) {
        return res.status(404).json({ error: 'not_a_member' });
    }

    if (group.ownerId === user.id) {
        return res.status(400).json({ error: 'owner_cannot_leave' });
    }

    group.members = group.members.filter((id) => id !== user.id);
    res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Requests / invitaciones
// ---------------------------------------------------------------------------

// GET /api/creator/requests?creator=username — invitaciones pendientes
router.get('/creator/requests', (req, res) => {
    const { creator } = req.query;
    const user = users.find((entry) => entry.username === creator);

    if (!user) {
        return res.json([]);
    }

    res.json(
        requests
            .filter((entry) => entry.userId === user.id && entry.status === 'pending')
            .map(mapRequest)
    );
});

// POST /api/creator/requests/:id/respond — aceptar o rechazar una invitación
router.post('/creator/requests/:id/respond', (req, res) => {
    const request = requests.find((entry) => entry.id === req.params.id);
    if (!request || request.status !== 'pending') {
        return res.status(404).json({ error: 'request_not_found' });
    }

    const { creator, action } = req.body || {};
    const user = users.find((entry) => entry.username === creator);

    if (!user || user.id !== request.userId) {
        return res.status(403).json({ error: 'forbidden' });
    }

    if (action === 'accept') {
        const group = findGroup(request.groupId);
        if (!group) {
            return res.status(404).json({ error: 'group_not_found' });
        }
        if (!group.members.includes(user.id)) {
            group.members.push(user.id);
        }
        request.status = 'accepted';
        requests.splice(requests.indexOf(request), 1);
        return res.json({ group: mapGroup(group) });
    }

    if (action === 'decline') {
        request.status = 'declined';
        requests.splice(requests.indexOf(request), 1);
        return res.json({ ok: true });
    }

    res.status(400).json({ error: 'invalid_action' });
});

export default router;
