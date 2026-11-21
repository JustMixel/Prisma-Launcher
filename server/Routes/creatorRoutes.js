import express from 'express';

const router = express.Router();

// ---------------------------------------------------------------------------
// Prisma Creator Network — datos mock en memoria (F0).
// Cuentas, proyectos ocultos y códigos de canje.
// ---------------------------------------------------------------------------

const users = [
    { id: 1, username: 'dev', password: 'dev123', displayName: 'Prisma Dev', role: 'developer', activated: true },
    { id: 2, username: 'tester', password: 'tester123', displayName: 'Tester Uno', role: 'tester', activated: true },
    { id: 3, username: 'user', password: 'user123', displayName: 'Miembro Común', role: 'member', activated: false }
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
            { code: 'PRISMA-TEST', maxUses: 100, used: 0, expiresAt: null, active: true }
        ],
        createdAt: '2026-11-19T12:00:00.000Z',
        updatedAt: '2026-11-19T12:00:00.000Z'
    }
];

function publicUser(user) {
    const { password, ...rest } = user;
    return rest;
}

function creatorName(project) {
    const creator = users.find((user) => user.id === project.creatorId);
    return creator ? creator.displayName : null;
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

// GET /api/users — lista pública (para gestión de testers en F2)
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
    project.updatedAt = new Date().toISOString();

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

// GET /api/creator/projects — proyectos de un creador (F2: vista lista)
router.get('/creator/projects', (req, res) => {
    const { creator } = req.query;
    const list = creator
        ? projects.filter((project) => {
            const user = users.find((entry) => entry.username === creator);
            return user && project.creatorId === user.id;
        })
        : projects;

    res.json(
        list.map((project) => ({
            id: project.id,
            name: project.name,
            description: project.description,
            category: project.category,
            cover: project.cover,
            tags: project.tags,
            version: project.version,
            visibility: project.visibility,
            statsIni: project.statsIni,
            creatorName: creatorName(project),
            testerCount: project.testers.length,
            codes: project.codes.map((entryCode) => ({
                code: entryCode.code,
                maxUses: entryCode.maxUses,
                used: entryCode.used,
                expiresAt: entryCode.expiresAt,
                active: entryCode.active
            })),
            createdAt: project.createdAt,
            updatedAt: project.updatedAt
        }))
    );
});

export default router;
