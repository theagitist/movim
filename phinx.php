<?php

require 'vendor/autoload.php';

$bootstrap = new Movim\Bootstrap;
$bootstrap->boot(true);

// Phinx's Postgres adapter only puts dbname/host/port in the DSN and ignores
// sslmode/sslrootcert. PDO's libpq backend reads PGSSLMODE/PGSSLROOTCERT from
// the environment as a fallback, so set them here for the managed cluster
// (verify-ca). Harmless for local connections where these are unset.
if (config('database.sslmode')) {
    putenv('PGSSLMODE=' . config('database.sslmode'));
}
if (config('database.sslrootcert')) {
    putenv('PGSSLROOTCERT=' . config('database.sslrootcert'));
}

return [
    'paths' => [
        'migrations' => DOCUMENT_ROOT . '/database/migrations',
        'seeds' => DOCUMENT_ROOT . '/database/seeds'
    ],
    'environments' => [
        'default_migration_table' => 'phinxlog',
        'default_environment' => 'movim',
        'movim' => [
            'adapter'   => config('database.driver'),
            'host'      => config('database.host'),
            'name'      => config('database.database'),
            'user'      => config('database.username'),
            'pass'      => config('database.password'),
            'port'      => config('database.port'),
        ]
    ]
];
