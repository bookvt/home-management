CREATE TABLE IF NOT EXISTS maintenance (
    id          BIGSERIAL PRIMARY KEY,
    name        TEXT      NOT NULL,
    date        DATE      NOT NULL,
    notes       TEXT      NOT NULL DEFAULT '',
    next_due_date DATE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assets (
    id              BIGSERIAL PRIMARY KEY,
    name            TEXT          NOT NULL,
    category        TEXT          NOT NULL,
    purchase_date   DATE,
    price           NUMERIC(12,2),
    warranty_expiry DATE,
    notes           TEXT          NOT NULL DEFAULT '',
    image_url       TEXT          NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
    id         BIGSERIAL PRIMARY KEY,
    type       TEXT          NOT NULL,
    amount     NUMERIC(12,2) NOT NULL,
    month      TEXT          NOT NULL DEFAULT '',
    is_one_off BOOLEAN       NOT NULL DEFAULT FALSE,
    date       DATE,
    notes      TEXT          NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
    id          BIGSERIAL PRIMARY KEY,
    title       TEXT        NOT NULL,
    category    TEXT        NOT NULL,
    file_url    TEXT        NOT NULL,
    expiry_date DATE,
    notes       TEXT        NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
