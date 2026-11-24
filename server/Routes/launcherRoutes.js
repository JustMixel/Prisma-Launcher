import express from 'express';

const router = express.Router();

const producers = {
    7: {
        id: 7,
        name: 'Mixel',
        avatar_url: null,
        profile_url: null
    },
    12: {
        id: 12,
        name: 'Marcelo',
        avatar_url: null,
        profile_url: null
    }
};

const devgroups = {
    3: {
        id: 3,
        name: 'Prisma Interactive',
        logo_url: 'https://placehold.co/96x96',
        profile_url: null
    }
};

const assets = {
    101: {
        id: 101,
        owner_type: 'mod',
        owner_id: 1,
        type: 'cover',
        url: 'https://placehold.co/700x1024',
        width: 700,
        height: 1024,
        mime_type: 'image/jpeg',
        checksum: 'sha256:abc101',
        cache_key: 'mod-1-cover-v51'
    },
    102: {
        id: 102,
        owner_type: 'mod',
        owner_id: 1,
        type: 'icon',
        url: 'https://placehold.co/32x32',
        width: 32,
        height: 32,
        mime_type: 'image/png',
        checksum: 'sha256:abc102',
        cache_key: 'mod-1-icon-v51'
    },
    103: {
        id: 103,
        owner_type: 'mod',
        owner_id: 1,
        type: 'hover_background',
        url: 'http://localhost:3000/static/stranded.png',
        width: 1920,
        height: 1080,
        mime_type: 'image/jpeg',
        checksum: 'sha256:abc103',
        cache_key: 'mod-1-hover-bg-v51'
    },
    105: {
        id: 105,
        owner_type: 'mod',
        owner_id: 2,
        type: 'cover',
        url: 'https://placehold.co/700x1024',
        width: 700,
        height: 1024,
        mime_type: 'image/jpeg',
        checksum: 'sha256:def105',
        cache_key: 'mod-2-cover-v88'
    },
    106: {
        id: 106,
        owner_type: 'mod',
        owner_id: 2,
        type: 'icon',
        url: 'https://placehold.co/32x32',
        width: 32,
        height: 32,
        mime_type: 'image/png',
        checksum: 'sha256:def106',
        cache_key: 'mod-2-icon-v88'
    },
    107: {
        id: 107,
        owner_type: 'mod',
        owner_id: 2,
        type: 'hover_background',
        url: 'http://localhost:3000/static/stranded.png',
        width: 1920,
        height: 1080,
        mime_type: 'image/jpeg',
        checksum: 'sha256:def107',
        cache_key: 'mod-2-hover-bg-v88'
    }
};

const versions = {
    51: {
        id: 51,
        mod_id: 1,
        version: '1.2.0',
        changelog: 'Balance changes and new missions.',
        released_at: '2026-11-18T19:00:00.000Z',
        download_url: 'https://prisma.example/downloads/syndicate/v1.2.0-full.zip',
        checksum: 'sha256:zip501',
        file_size: 524288000,
        dependencies: [],
        is_current: true,
        launch_config: {
            type: 'exe',
            relativePath: 'bin/Syndicate.exe',
            args: ['-windowed'],
            workingDir: '.'
        }
    },
    52: {
        id: 52,
        mod_id: 1,
        version: '1.4.0',
        name: 'The November Update',
        changelog: 'Nueva campaña, mejoras de IA y balance general.',
        released_at: '2026-11-19T18:00:00.000Z',
        download_url: 'https://prisma.example/downloads/syndicate/v1.4.0-patch.zip',
        checksum: 'sha256:zip520',
        file_size: 576716800,
        dependencies: [],
        is_current: false,
        is_update: true,
        launch_config: {
            type: 'exe',
            relativePath: 'bin/Syndicate.exe',
            args: ['-windowed'],
            workingDir: '.'
        }
    },
    88: {
        id: 88,
        mod_id: 2,
        version: '2.0.1',
        changelog: 'Initial release.',
        released_at: null,
        download_url: 'https://prisma.example/downloads/neondrift/v2.0.1-full.zip',
        checksum: 'sha256:zip881',
        file_size: 268435456,
        dependencies: [],
        is_current: true,
        launch_config: {
            type: 'exe',
            relativePath: 'game/NeonDrift.exe',
            args: [],
            workingDir: 'game'
        }
    },
    89: {
        id: 89,
        mod_id: 2,
        version: '2.1.0',
        name: 'Neon Nights Update',
        changelog: 'Nuevos circuitos nocturnos, autos y sistema de clima.',
        released_at: '2026-11-19T20:00:00.000Z',
        download_url: 'https://prisma.example/downloads/neondrift/v2.1.0-patch.zip',
        checksum: 'sha256:zip890',
        file_size: 314572800,
        dependencies: [],
        is_current: false,
        is_update: true,
        launch_config: {
            type: 'exe',
            relativePath: 'game/NeonDrift.exe',
            args: [],
            workingDir: 'game'
        }
    }
};

const mods = [
    {
        m_id: 1,
        m_name: 'Syndicate: The Empire',
        m_desc: 'Un mod de estrategia espacial.',
        m_producerid: 7,
        m_devgroupid: 3,
        m_currentversionid: 51,
        m_assetids: {
            cover: 101,
            icon: 102,
            hover_background: 103,
            hover_music: null
        },
        m_releasedate: '2026-11-20T12:00:00.000Z',
        m_status: 'published',
        m_downloads: 1200,
        m_ratingAverage: 7.5,
        m_ratingCount: 8,
        m_accentcolor: '#3a2b25',
        m_tags: ['estrategia', 'espacial', 'misiones'],
        m_update: {
            version: '1.4.0',
            name: 'The November Update',
            display: 'version',
            download_url: 'https://prisma.example/downloads/syndicate/v1.4.0-patch.zip'
        }
    },
    {
        m_id: 2,
        m_name: 'Neon Drift',
        m_desc: 'Carreras nocturnas.',
        m_producerid: 12,
        m_devgroupid: null,
        m_currentversionid: 88,
        m_assetids: {
            cover: 105,
            icon: 106,
            hover_background: 107,
            hover_music: null
        },
        m_releasedate: null,
        m_status: 'published',
        m_downloads: 340,
        m_ratingAverage: 6.2,
        m_ratingCount: 4,
        m_accentcolor: '#2b3a3a',
        m_tags: ['carreras', 'arcade', 'nocturno'],
        m_update: {
            version: '2.1.0',
            name: 'Neon Nights Update',
            display: 'name',
            download_url: 'https://prisma.example/downloads/neondrift/v2.1.0-patch.zip'
        }
    }
];

function findMod(id) {
    return mods.find(mod => mod.m_id === Number(id));
}

// Solo los mods publicados son visibles en la Store; draft/hidden se ocultan.
function storeVisible(modsList) {
    return modsList.filter(mod => mod.m_status === 'published');
}

function buildIncludes(modsList) {
    const producerIds = new Set();
    const devgroupIds = new Set();
    const versionIds = new Set();
    const assetIds = new Set();

    for (const mod of modsList) {
        if (mod.m_producerid !== null) {
            producerIds.add(mod.m_producerid);
        }

        if (mod.m_devgroupid !== null) {
            devgroupIds.add(mod.m_devgroupid);
        }

        versionIds.add(mod.m_currentversionid);

        for (const assetId of Object.values(mod.m_assetids)) {
            if (assetId !== null) {
                assetIds.add(assetId);
            }
        }
    }

    return {
        producers: Object.fromEntries(
            [...producerIds].map(id => [id, producers[id]])
        ),
        devgroups: Object.fromEntries(
            [...devgroupIds].map(id => [id, devgroups[id]])
        ),
        versions: Object.fromEntries(
            [...versionIds].map(id => [id, versions[id]])
        ),
        assets: Object.fromEntries(
            [...assetIds].map(id => [id, assets[id]])
        )
    };
}

function buildLegacyMod(mod) {
    const version = versions[mod.m_currentversionid];

    return {
        ID: mod.m_id,
        ...mod,
        m_cover: assets[mod.m_assetids.cover]?.url || null,
        m_hoverimage: assets[mod.m_assetids.hover_background]?.url || null,
        m_hovermusic: assets[mod.m_assetids.hover_music]?.url || null,
        m_devgroupname: devgroups[mod.m_devgroupid]?.name || null,
        m_devgrouplogo: devgroups[mod.m_devgroupid]?.logo_url || null,
        m_producername: producers[mod.m_producerid]?.name || null,
        m_producerlogo: producers[mod.m_producerid]?.avatar_url || null,
        m_version: version?.version || null,
        m_update: mod.m_update || null,
        m_link: version?.download_url || null
    };
}

router.get('/catalog', (req, res) => {
    const visibleMods = storeVisible(mods);

    res.json({
        items: visibleMods,
        includes: buildIncludes(visibleMods),
        meta: {
            nextCursor: null,
            etag: 'W/"mods-page-1"',
            updatedAt: '2026-11-18T18:30:00.000Z'
        }
    });
});

router.get('/mods', (req, res) => {
    res.json(storeVisible(mods).map(buildLegacyMod));
});

router.get('/mods/:id/versions', (req, res) => {
    const mod = findMod(req.params.id);

    if (!mod) {
        return res.status(404).json({ error: 'Mod not found' });
    }

    res.json({
        items: Object.values(versions).filter(version => version.mod_id === mod.m_id)
    });
});

router.get('/mods/:id', (req, res) => {
    const mod = findMod(req.params.id);

    if (!mod) {
        return res.status(404).json({ error: 'Mod not found' });
    }

    res.json({
        item: mod,
        includes: buildIncludes([mod])
    });
});

export default router;
