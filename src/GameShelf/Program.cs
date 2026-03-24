using System.Text.Json;
using GameShelf.Models;
using GameShelf.Services;
using Microsoft.AspNetCore.StaticFiles;

// Resolve paths so the app works whether run via `dotnet run`, DLL, or published
var assemblyDir = Path.GetDirectoryName(System.Reflection.Assembly.GetExecutingAssembly().Location)!;

// Try source-tree wwwroot first (dev), then assembly-local (published)
var srcWebRoot = Path.GetFullPath(Path.Combine(assemblyDir, "..", "..", "..", "wwwroot"));
var pubWebRoot = Path.Combine(assemblyDir, "wwwroot");
var webRoot = Directory.Exists(srcWebRoot) ? srcWebRoot : pubWebRoot;
var contentRoot = Path.GetDirectoryName(webRoot)!;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    ContentRootPath = contentRoot,
    WebRootPath = webRoot
});

builder.Services.AddSingleton<LibraryService>();
builder.Services.AddSingleton<EmulatorService>();

var app = builder.Build();

// Scan library on startup
var library = app.Services.GetRequiredService<LibraryService>();
library.Scan();

app.UseDefaultFiles();
app.UseStaticFiles();

// ── Library API ──────────────────────────────────────────────

app.MapGet("/api/games", (LibraryService lib) =>
{
    var games = lib.GetAll().Select(g => new
    {
        g.Id,
        g.Title,
        g.Year,
        g.Publisher,
        g.Genre,
        diskCount = g.Disks.Count,
        hasManual = g.Manual != null,
        hasCodes = g.Codes != null,
        cpuMin = g.Requirements?.CpuMin,
        coverFront = g.CoverFront != null ? $"/api/games/{g.Id}/media/{g.CoverFront}" : null,
        coverBack = g.CoverBack != null ? $"/api/games/{g.Id}/media/{g.CoverBack}" : null,
        coverSpine = g.CoverSpine != null ? $"/api/games/{g.Id}/media/{g.CoverSpine}" : null
    });
    return Results.Ok(games);
});

app.MapGet("/api/games/{id}", (string id, LibraryService lib) =>
{
    var game = lib.GetById(id);
    if (game == null) return Results.NotFound();

    return Results.Ok(new
    {
        game.Id,
        game.Title,
        game.Year,
        game.Publisher,
        game.Genre,
        game.Disks,
        manual = game.Manual,
        codes = game.Codes,
        requirements = game.Requirements,
        coverFront = game.CoverFront != null ? $"/api/games/{id}/media/{game.CoverFront}" : null,
        coverBack = game.CoverBack != null ? $"/api/games/{id}/media/{game.CoverBack}" : null,
        coverSpine = game.CoverSpine != null ? $"/api/games/{id}/media/{game.CoverSpine}" : null
    });
});

app.MapGet("/api/games/{id}/media/{**path}", (string id, string path, LibraryService lib) =>
{
    var filePath = lib.ResolveMediaPath(id, path);
    if (filePath == null) return Results.NotFound();

    var provider = new FileExtensionContentTypeProvider();
    if (!provider.TryGetContentType(filePath, out var contentType))
        contentType = "application/octet-stream";

    return Results.File(filePath, contentType);
});

app.MapGet("/api/games/{id}/manual", (string id, LibraryService lib) =>
{
    var game = lib.GetById(id);
    if (game?.Manual == null) return Results.NotFound();

    var filePath = lib.ResolveMediaPath(id, game.Manual);
    if (filePath == null) return Results.NotFound();

    return Results.File(filePath, "application/pdf");
});

app.MapGet("/api/games/{id}/codes", (string id, LibraryService lib) =>
{
    var configPath = lib.ResolveCodesConfigPath(id);
    if (configPath == null) return Results.NotFound();

    var json = File.ReadAllText(configPath);
    var config = JsonSerializer.Deserialize<CodeWheelConfig>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    return Results.Ok(config);
});

// ── Emulator (86Box) API ─────────────────────────────────────

app.MapGet("/api/fdd", (EmulatorService emu) =>
{
    return Results.Ok(emu.GetMountedDisks());
});

app.MapPost("/api/fdd/{drive:int}", async (int drive, HttpRequest req, EmulatorService emu, LibraryService lib) =>
{
    var body = await JsonSerializer.DeserializeAsync<MountRequest>(req.Body);
    if (body == null) return Results.BadRequest("Missing body");

    // Resolve the disk path: gameId + disk file path
    var diskPath = lib.ResolveMediaPath(body.GameId, body.DiskFile);
    if (diskPath == null) return Results.NotFound("Disk file not found");

    var ok = await emu.MountDisk(drive, diskPath);
    return ok ? Results.Ok(new { mounted = true, drive, path = diskPath })
              : Results.StatusCode(502);
});

app.MapDelete("/api/fdd/{drive:int}", async (int drive, EmulatorService emu) =>
{
    var ok = await emu.EjectDisk(drive);
    return ok ? Results.Ok(new { ejected = true, drive })
              : Results.StatusCode(502);
});

// ── Rescan ───────────────────────────────────────────────────

app.MapPost("/api/library/rescan", (LibraryService lib) =>
{
    lib.Scan();
    return Results.Ok(new { count = lib.GetAll().Count });
});

app.Run();

record MountRequest(string GameId, string DiskFile);
