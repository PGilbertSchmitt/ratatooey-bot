CREATE TABLE rotations (
    id TEXT PRIMARY KEY,
    done INTEGER NOT NULL, -- bool (0 for false and 1 for true)
    selection_type TEXT NOT NULL, -- auto, manual, or magic
    initiator_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE memberships (
    rotation_id TEXT REFERENCES rotations(id),
    member_id TEXT NOT NULL,
    other_member_id TEXT
);
