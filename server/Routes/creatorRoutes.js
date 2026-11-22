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

const VISIBILITIES = ['draft', 'hidden', 'published'];

function publicUser(user) {
    const { password, ...rest } = user;
    return rest;
}

function creatorName(project) {
    const creator = users.find((user) => user.id === project.creatorId);
    return creator ? creator.displayName : null;
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
        testers: [],
        codes: [],
        createdAt: now,
        updatedAt: now
    };

    const maxUses = Number(body.generateCodeMaxUses);
    if (Number.isFinite(maxUses) && maxUses >= 1) {
        project.codes.push(generateCode(Math.floor(maxUses)));
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

    ['name', 'description', 'category', 'cover', 'version', 'executablePath', 'statsIni', 'releasedate', 'credits', 'requirements', 'changelog', 'languages'].forEach((field) => {
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

export default router;
