<laravel-boost-guidelines>
=== foundation rules ===

# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated by Laravel maintainers for this application. These guidelines should be followed closely to ensure the best experience when building Laravel applications.

## Foundational Context

This application is a Laravel application and its main Laravel ecosystems package & versions are below. You are an expert with them all. Ensure you abide by these specific packages & versions.

- php - 8.4.8
- inertiajs/inertia-laravel (INERTIA_LARAVEL) - v2
- laravel/fortify (FORTIFY) - v1
- laravel/framework (LARAVEL) - v12
- laravel/prompts (PROMPTS) - v0
- laravel/socialite (SOCIALITE) - v5
- laravel/wayfinder (WAYFINDER) - v0
- laravel/boost (BOOST) - v2
- laravel/dusk (DUSK) - v8
- laravel/mcp (MCP) - v0
- laravel/pail (PAIL) - v1
- laravel/pint (PINT) - v1
- laravel/sail (SAIL) - v1
- pestphp/pest (PEST) - v4
- phpunit/phpunit (PHPUNIT) - v12
- @inertiajs/react (INERTIA_REACT) - v2
- react (REACT) - v19
- tailwindcss (TAILWINDCSS) - v4
- @laravel/vite-plugin-wayfinder (WAYFINDER_VITE) - v0
- eslint (ESLINT) - v9
- prettier (PRETTIER) - v3

## Skills Activation

This project has domain-specific skills available. You MUST activate the relevant skill whenever you work in that domain—don't wait until you're stuck.

- `wayfinder-development` — Activates whenever referencing backend routes in frontend components. Use when importing from @/actions or @/routes, calling Laravel routes from TypeScript, or working with Wayfinder route functions.
- `pest-testing` — Tests applications using the Pest 4 PHP framework. Activates when writing tests, creating unit or feature tests, adding assertions, testing Livewire components, browser testing, debugging test failures, working with datasets or mocking; or when the user mentions test, spec, TDD, expects, assertion, coverage, or needs to verify functionality works.
- `inertia-react-development` — Develops Inertia.js v2 React client-side applications. Activates when creating React pages, forms, or navigation; using &lt;Link&gt;, &lt;Form&gt;, useForm, or router; working with deferred props, prefetching, or polling; or when user mentions React with Inertia, React pages, React forms, or React navigation.
- `tailwindcss-development` — Styles applications using Tailwind CSS v4 utilities. Activates when adding styles, restyling components, working with gradients, spacing, layout, flex, grid, responsive design, dark mode, colors, typography, or borders; or when the user mentions CSS, styling, classes, Tailwind, restyle, hero section, cards, buttons, or any visual/UI changes.
- `developing-with-fortify` — Laravel Fortify headless authentication backend development. Activate when implementing authentication features including login, registration, password reset, email verification, two-factor authentication (2FA/TOTP), profile updates, headless auth, authentication scaffolding, or auth guards in Laravel applications.
- `laravel-permission-development` — Build and work with Spatie Laravel Permission features, including roles, permissions, middleware, policies, teams, and Blade directives.

## Conventions

- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, and naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts

- Do not create verification scripts or tinker when tests cover that functionality and prove they work. Unit and feature tests are more important.

## Application Structure & Architecture

- Stick to existing directory structure; don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling

- If the user doesn't see a frontend change reflected in the UI, it could mean they need to run `npm run build`, `npm run dev`, or `composer run dev`. Ask them.

## Documentation Files

- You must only create documentation files if explicitly requested by the user.

## Replies

- Be concise in your explanations - focus on what's important rather than explaining obvious details.

=== boost rules ===

# Laravel Boost

- Laravel Boost is an MCP server that comes with powerful tools designed specifically for this application. Use them.

## Artisan

- Use the `list-artisan-commands` tool when you need to call an Artisan command to double-check the available parameters.

## URLs

- Whenever you share a project URL with the user, you should use the `get-absolute-url` tool to ensure you're using the correct scheme, domain/IP, and port.

## Tinker / Debugging

- You should use the `tinker` tool when you need to execute PHP to debug code or query Eloquent models directly.
- Use the `database-query` tool when you only need to read from the database.
- Use the `database-schema` tool to inspect table structure before writing migrations or models.

## Reading Browser Logs With the `browser-logs` Tool

- You can read browser logs, errors, and exceptions using the `browser-logs` tool from Boost.
- Only recent browser logs will be useful - ignore old logs.

## Searching Documentation (Critically Important)

- Boost comes with a powerful `search-docs` tool you should use before trying other approaches when working with Laravel or Laravel ecosystem packages. This tool automatically passes a list of installed packages and their versions to the remote Boost API, so it returns only version-specific documentation for the user's circumstance. You should pass an array of packages to filter on if you know you need docs for particular packages.
- Search the documentation before making code changes to ensure we are taking the correct approach.
- Use multiple, broad, simple, topic-based queries at once. For example: `['rate limiting', 'routing rate limiting', 'routing']`. The most relevant results will be returned first.
- Do not add package names to queries; package information is already shared. For example, use `test resource table`, not `filament 4 test resource table`.

### Available Search Syntax

1. Simple Word Searches with auto-stemming - query=authentication - finds 'authenticate' and 'auth'.
2. Multiple Words (AND Logic) - query=rate limit - finds knowledge containing both "rate" AND "limit".
3. Quoted Phrases (Exact Position) - query="infinite scroll" - words must be adjacent and in that order.
4. Mixed Queries - query=middleware "rate limit" - "middleware" AND exact phrase "rate limit".
5. Multiple Queries - queries=["authentication", "middleware"] - ANY of these terms.

=== php rules ===

# PHP

- Always use curly braces for control structures, even for single-line bodies.

## Constructors

- Use PHP 8 constructor property promotion in `__construct()`.
    - `public function __construct(public GitHub $github) { }`
- Do not allow empty `__construct()` methods with zero parameters unless the constructor is private.

## Type Declarations

- Always use explicit return type declarations for methods and functions.
- Use appropriate PHP type hints for method parameters.

<!-- Explicit Return Types and Method Params -->
```php
protected function isAccessible(User $user, ?string $path = null): bool
{
    ...
}
```

## Enums

- Typically, keys in an Enum should be TitleCase. For example: `FavoritePerson`, `BestLake`, `Monthly`.

## Comments

- Prefer PHPDoc blocks over inline comments. Never use comments within the code itself unless the logic is exceptionally complex.

## PHPDoc Blocks

- Add useful array shape type definitions when appropriate.

=== tests rules ===

# Test Enforcement

- Every change must be programmatically tested. Write a new test or update an existing test, then run the affected tests to make sure they pass.
- Run the minimum number of tests needed to ensure code quality and speed. Use `php artisan test --compact` with a specific filename or filter.

=== inertia-laravel/core rules ===

# Inertia

- Inertia creates fully client-side rendered SPAs without modern SPA complexity, leveraging existing server-side patterns.
- Components live in `resources/js/pages` (unless specified in `vite.config.js`). Use `Inertia::render()` for server-side routing instead of Blade views.
- ALWAYS use `search-docs` tool for version-specific Inertia documentation and updated code examples.
- IMPORTANT: Activate `inertia-react-development` when working with Inertia client-side patterns.

# Inertia v2

- Use all Inertia features from v1 and v2. Check the documentation before making changes to ensure the correct approach.
- New features: deferred props, infinite scroll, merging props, polling, prefetching, once props, flash data.
- When using deferred props, add an empty state with a pulsing or animated skeleton.

=== laravel/core rules ===

# Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using the `list-artisan-commands` tool.
- If you're creating a generic PHP class, use `php artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

## Database

- Always use proper Eloquent relationship methods with return type hints. Prefer relationship methods over raw queries or manual joins.
- Use Eloquent models and relationships before suggesting raw database queries.
- Avoid `DB::`; prefer `Model::query()`. Generate code that leverages Laravel's ORM capabilities rather than bypassing them.
- Generate code that prevents N+1 query problems by using eager loading.
- Use Laravel's query builder for very complex database operations.

### Model Creation

- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `list-artisan-commands` to check the available options to `php artisan make:model`.

### APIs & Eloquent Resources

- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

## Controllers & Validation

- Always create Form Request classes for validation rather than inline validation in controllers. Include both validation rules and custom error messages.
- Check sibling Form Requests to see if the application uses array or string based validation rules.

## Authentication & Authorization

- Use Laravel's built-in authentication and authorization features (gates, policies, Sanctum, etc.).

## URL Generation

- When generating links to other pages, prefer named routes and the `route()` function.

## Queues

- Use queued jobs for time-consuming operations with the `ShouldQueue` interface.

## Configuration

- Use environment variables only in configuration files - never use the `env()` function directly outside of config files. Always use `config('app.name')`, not `env('APP_NAME')`.

## Testing

- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] {name}` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

## Vite Error

- If you receive an "Illuminate\Foundation\ViteException: Unable to locate file in Vite manifest" error, you can run `npm run build` or ask the user to run `npm run dev` or `composer run dev`.

=== laravel/v12 rules ===

# Laravel 12

- CRITICAL: ALWAYS use `search-docs` tool for version-specific Laravel documentation and updated code examples.
- Since Laravel 11, Laravel has a new streamlined file structure which this project uses.

## Laravel 12 Structure

- In Laravel 12, middleware are no longer registered in `app/Http/Kernel.php`.
- Middleware are configured declaratively in `bootstrap/app.php` using `Application::configure()->withMiddleware()`.
- `bootstrap/app.php` is the file to register middleware, exceptions, and routing files.
- `bootstrap/providers.php` contains application specific service providers.
- The `app\Console\Kernel.php` file no longer exists; use `bootstrap/app.php` or `routes/console.php` for console configuration.
- Console commands in `app/Console/Commands/` are automatically available and do not require manual registration.

## Database

- When modifying a column, the migration must include all of the attributes that were previously defined on the column. Otherwise, they will be dropped and lost.
- Laravel 12 allows limiting eagerly loaded records natively, without external packages: `$query->latest()->limit(10);`.

### Models

- Casts can and likely should be set in a `casts()` method on a model rather than the `$casts` property. Follow existing conventions from other models.

=== wayfinder/core rules ===

# Laravel Wayfinder

Wayfinder generates TypeScript functions for Laravel routes. Import from `@/actions/` (controllers) or `@/routes/` (named routes).

- IMPORTANT: Activate `wayfinder-development` skill whenever referencing backend routes in frontend components.
- Invokable Controllers: `import StorePost from '@/actions/.../StorePostController'; StorePost()`.
- Parameter Binding: Detects route keys (`{post:slug}`) — `show({ slug: "my-post" })`.
- Query Merging: `show(1, { mergeQuery: { page: 2, sort: null } })` merges with current URL, `null` removes params.
- Inertia: Use `.form()` with `<Form>` component or `form.submit(store())` with useForm.

=== pint/core rules ===

# Laravel Pint Code Formatter

- If you have modified any PHP files, you must run `vendor/bin/pint --dirty --format agent` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test --format agent`, simply run `vendor/bin/pint --format agent` to fix any formatting issues.

=== pest/core rules ===

## Pest

- This project uses Pest for testing. Create tests: `php artisan make:test --pest {name}`.
- Run tests: `php artisan test --compact` or filter: `php artisan test --compact --filter=testName`.
- Do NOT delete tests without approval.
- CRITICAL: ALWAYS use `search-docs` tool for version-specific Pest documentation and updated code examples.
- IMPORTANT: Activate `pest-testing` every time you're working with a Pest or testing-related task.

=== inertia-react/core rules ===

# Inertia + React

- IMPORTANT: Activate `inertia-react-development` when working with Inertia React client-side patterns.

=== tailwindcss/core rules ===

# Tailwind CSS

- Always use existing Tailwind conventions; check project patterns before adding new ones.
- IMPORTANT: Always use `search-docs` tool for version-specific Tailwind CSS documentation and updated code examples. Never rely on training data.
- IMPORTANT: Activate `tailwindcss-development` every time you're working with a Tailwind CSS or styling-related task.

=== laravel/fortify rules ===

# Laravel Fortify

- Fortify is a headless authentication backend that provides authentication routes and controllers for Laravel applications.
- IMPORTANT: Always use the `search-docs` tool for detailed Laravel Fortify patterns and documentation.
- IMPORTANT: Activate `developing-with-fortify` skill when working with Fortify authentication features.

</laravel-boost-guidelines>

# Admin Panel UI/UX Design System

Dokumentasi ini mendeskripsikan pola desain yang digunakan di seluruh halaman admin panel agar tampilan tetap konsisten.

## Typografi & Font

- **Heading font**: `font-heading` (Outfit) — digunakan untuk judul halaman, nama lapangan, harga, dan teks bold yang menonjol.
- **Body font**: `font-sans` (Inter) — digunakan untuk semua teks konten, label, dan deskripsi.
- **Judul halaman (h1)**: `text-2xl sm:text-3xl font-heading font-semibold text-slate-900` atau `text-3xl font-bold tracking-tight text-slate-900`
- **Sub-judul / deskripsi halaman**: `text-xs sm:text-sm text-slate-500` atau `text-sm font-medium text-slate-500`
- **Label tabel header**: `text-[10px] font-light tracking-wide text-slate-600`
- **Badge / pill label kecil**: `text-[10px] font-bold uppercase tracking-widest`

## Palet Warna (Custom Tokens)

Warna utama didefinisikan di `resources/css/app.css` dan digunakan via Tailwind:

| Token | Hex | Kegunaan |
|---|---|---|
| `padel-green` | `#10b981` | CTA utama, tombol primary, border aktif |
| `padel-green-dark` | `#059669` | Hover state tombol primary |
| `padel-green-50` | `#ecfdf5` | Badge background, highlight ringan |
| `padel-dark` | `#0f172a` | Teks utama, sidebar text |
| `padel-light` | `#f8fafc` | Background body |
| `padel-border` | `#e2e8f0` | Border default seluruh elemen |
| `padel-muted` | `#64748b` | Teks sekunder / placeholder |

**Warna Semantik untuk Status:**
- `confirmed` → `bg-emerald-100 text-emerald-700 ring-emerald-600/20`
- `pending` → `bg-amber-100 text-amber-700 ring-amber-600/20`
- `completed` → `bg-blue-100 text-blue-700 ring-blue-600/20`
- `cancelled` → `bg-red-100 text-red-700 ring-red-600/20`

## Layout & Struktur Halaman

- Wrapper halaman: `mx-auto flex min-h-screen w-full max-w-[1400px] flex-1 flex-col gap-4 bg-white p-4 md:gap-6 md:p-8`
- Khusus Courts (lebih lebar): `flex flex-col gap-6 p-6 w-full max-w-[1600px] mx-auto`
- Dashboard: `mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 p-4 md:p-8`
- **Header section** selalu: judul (`h1`) + deskripsi (`p`) di kiri, tombol aksi di kanan, menggunakan `flex flex-col md:flex-row md:items-end justify-between gap-4`

## Tombol

### Primary (CTA)
```
rounded-lg sm:rounded-xl bg-padel-green px-3 sm:px-4 md:px-5 py-2 sm:py-2.5
text-xs sm:text-sm font-semibold text-white shadow-sm
hover:bg-padel-green-dark transition-all
focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-padel-green
disabled:opacity-50
```

### Secondary / Outline
```
rounded-lg sm:rounded-xl bg-white border border-slate-200 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5
text-xs sm:text-sm font-semibold text-slate-700 shadow-sm
hover:bg-slate-50 transition-all
```

### Primary dalam Modal (dengan animasi hover)
```
rounded-lg bg-padel-green px-6 h-10 text-sm font-medium text-white
shadow-sm shadow-padel-green/30
transition-all duration-300
hover:-translate-y-0.5 hover:bg-padel-green-dark hover:shadow-md hover:shadow-padel-green/40
active:translate-y-0 active:scale-[0.98]
disabled:opacity-50 disabled:hover:-translate-y-0
```

### Cancel / Ghost
```
h-10 rounded-lg px-4 text-sm font-medium text-slate-600
hover:bg-slate-100 hover:text-slate-900 transition-colors
```

### Tombol Rounded (pill / filter chip)
```
inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-sm font-semibold transition-all
```
- Aktif: `bg-slate-900 border-slate-900 text-white shadow-sm`
- Aktif (padel-green): `bg-padel-green border-padel-green text-white shadow-sm`
- Tidak aktif: `bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700`

### Icon Button (Edit / Delete)
```
flex h-8 w-8 items-center justify-center rounded-md text-slate-400
transition-colors hover:bg-slate-100 hover:text-slate-900   /* edit */
transition-colors hover:bg-red-50 hover:text-red-600         /* delete */
```

## Kartu (Cards)

### Stat Card (Dashboard)
```
group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5
shadow-sm transition-all hover:border-{color}-200 hover:shadow-md
```
- Memiliki area chart kecil sebagai background dekoratif (opacity 30%)
- Icon dekoratif di pojok kanan atas dengan `absolute top-0 right-0 -mt-4 -mr-4 rounded-full bg-{color}-50/50 p-8`

### Court Card (Accordion)
```
bg-white rounded-2xl border shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] overflow-hidden transition-all duration-300
```
- Aktif/dipilih: `border-padel-green ring-1 ring-padel-green/30`
- Default: `border-slate-100 hover:border-slate-200 hover:shadow-md`

## Tabel Data

```html
<!-- Table wrapper -->
<div class="overflow-x-auto">
  <table class="w-full text-left text-sm whitespace-nowrap">
    <thead class="bg-slate-50">
      <tr class="border-b border-slate-200/80">
        <th class="px-5 py-4 text-[10px] font-light tracking-wide text-slate-600">...</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-100/80">
      <tr class="group transition-colors outline-none hover:bg-slate-50/40">
        <td class="px-5 py-4">...</td>
      </tr>
    </tbody>
  </table>
</div>
```

## Form Input (Floating Label Style)

Digunakan di dalam modal untuk field teks:
```
<!-- Input wrapper -->
<div class="group relative">
  <input
    placeholder=" "
    class="peer block w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent
           px-0 pt-6 pb-2.5 text-[15px] font-medium text-slate-900 placeholder-transparent
           transition-all duration-300
           hover:border-slate-300
           focus:border-padel-green focus:bg-transparent focus:ring-0 focus:outline-none"
  />
  <label class="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[15px] font-normal text-slate-500
                transition-all duration-300
                peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2
                peer-focus:top-2 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-widest peer-focus:text-padel-green peer-focus:uppercase
                peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-widest peer-[:not(:placeholder-shown)]:uppercase">
    Label
  </label>
</div>
```

## Search & Filter Bar

```
<!-- Search input -->
<div class="group relative flex items-center">
  <Search class="absolute left-3 h-4 w-4 text-slate-400" />
  <input class="h-9 w-full rounded-full border border-slate-200/80 bg-white pr-4 pl-9 text-sm
                focus:border-padel-green-dark focus:ring-padel-green-dark sm:w-64" />
</div>

<!-- Filter select -->
<div class="relative flex h-9 items-center">
  <Filter class="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
  <select class="h-full appearance-none rounded-full border border-slate-200/80 bg-white py-0 pr-8 pl-9
                 text-sm font-medium text-slate-600 hover:bg-slate-50
                 focus:border-padel-green-dark focus:ring-padel-green-dark" />
  <ChevronDown class="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
</div>
```

## Empty State

```
<div class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300
            bg-white p-12 text-center animate-in fade-in duration-500">
  <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
    <Icon class="h-8 w-8 text-slate-400" />
  </div>
  <h2 class="text-lg font-semibold text-slate-900 mb-1">Judul</h2>
  <p class="text-sm text-slate-500 max-w-sm mb-6">Deskripsi</p>
  <!-- optional CTA -->
</div>
```

## Status Indicators (Dot)

```
<!-- Status dot -->
<div class="w-2.5 h-2.5 rounded-full shadow-sm
            {booked: bg-red-500 shadow-red-500/40}
            {active: bg-padel-green shadow-padel-green/40}
            {inactive: bg-slate-300 shadow-slate-400/40}" />
```

## Statistik Ringkasan (Summary Stats Row)

Digunakan di halaman Sports/Facilities — baris statistik horizontal dengan border separator:
```
<div class="grid grid-cols-1 gap-6 border-t border-b border-slate-200 py-6 md:grid-cols-4 md:gap-8">
  <div class="flex flex-col">
    <span class="mb-2 text-xs font-semibold text-slate-500">Label</span>
    <span class="text-3xl font-semibold tracking-tight text-slate-900">Nilai</span>
    <span class="mt-2 text-xs font-medium text-slate-400">Sub-keterangan</span>
  </div>
  <!-- kolom berikutnya: md:border-l md:pl-8 -->
</div>
```

## Animasi & Transisi

- Default transition: `transition-all` atau `transition-colors`
- Durasi custom: `duration-300`, `duration-500`
- Hover scale efek dekoratif: `group-hover:scale-110`
- Collapse/expand dengan grid trick: `grid-rows-[1fr] opacity-100` ↔ `grid-rows-[0fr] opacity-0`
- Badge "live" / pulse indicator: `animate-ping` + `relative inline-flex rounded-full bg-padel-green`
- Chevron accordion: `transition-transform duration-300` + `rotate-180`

## Modal (Dialog)

- Menggunakan komponen `Dialog` dari `@/components/ui/dialog`
- `DialogContent` dengan `bg-white sm:max-w-[425px]`
- `DialogTitle` dengan `font-heading text-xl`
- Form di dalam dialog: `mt-4 flex flex-col gap-6`
- Footer tombol: `mt-2 flex justify-end gap-3`

## Pagination

```
<div class="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
  <span class="text-[13px] text-slate-500">
    Menampilkan: <span class="font-semibold text-slate-700">X - Y</span> of Z
  </span>
  <!-- Navigasi halaman -->
</div>
```

## Ikon

- Library: **lucide-react** — konsisten di seluruh halaman
- Ukuran standar: `h-4 w-4` (medium), `h-3.5 w-3.5` (kecil dalam tombol)
- `Pencil` untuk edit, `Trash2` untuk hapus, `Plus` untuk tambah, `Search` untuk pencarian, `Filter` untuk filter, `ChevronDown/Up` untuk sort/toggle
