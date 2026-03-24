using System.Text.Json;
using GameShelf.Models;

namespace GameShelf.Services;

public class LibraryService
{
    private readonly string _libraryPath;
    private readonly ILogger<LibraryService> _logger;
    private Dictionary<string, Game> _games = new();
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public LibraryService(IConfiguration config, IWebHostEnvironment env, ILogger<LibraryService> logger)
    {
        var configuredPath = config.GetValue<string>("Library:Path");
        if (!string.IsNullOrEmpty(configuredPath))
        {
            _libraryPath = Path.GetFullPath(configuredPath);
        }
        else
        {
            // Default: library/ folder at the solution root (3 levels up from bin/Debug/net8.0, then up past src/GameShelf)
            var assemblyDir = Path.GetDirectoryName(System.Reflection.Assembly.GetExecutingAssembly().Location)!;
            var solutionRoot = Path.GetFullPath(Path.Combine(assemblyDir, "..", "..", "..", "..", ".."));
            _libraryPath = Path.Combine(solutionRoot, "library");
        }
        _logger = logger;
    }

    public void Scan()
    {
        var games = new Dictionary<string, Game>();

        if (!Directory.Exists(_libraryPath))
        {
            _logger.LogWarning("Library path does not exist: {Path}", _libraryPath);
            return;
        }

        foreach (var dir in Directory.GetDirectories(_libraryPath))
        {
            var dirName = Path.GetFileName(dir);
            if (dirName.StartsWith("_")) continue;

            var gameJsonPath = Path.Combine(dir, "game.json");
            if (!File.Exists(gameJsonPath)) continue;

            try
            {
                var json = File.ReadAllText(gameJsonPath);
                var game = JsonSerializer.Deserialize<Game>(json, _jsonOptions);
                if (game == null) continue;

                game.Id = dirName;
                game.FolderPath = dir;

                // Auto-detect cover images if not specified
                game.CoverFront ??= DetectFile(dir, "cover-front");
                game.CoverBack ??= DetectFile(dir, "cover-back");
                game.CoverSpine ??= DetectFile(dir, "cover-spine");

                games[game.Id] = game;
                _logger.LogInformation("Loaded game: {Title} ({Id})", game.Title, game.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load game from {Dir}", dir);
            }
        }

        _games = games;
        _logger.LogInformation("Library scan complete: {Count} games loaded from {Path}", _games.Count, _libraryPath);
    }

    public IReadOnlyList<Game> GetAll() => _games.Values.ToList();

    public Game? GetById(string id) => _games.GetValueOrDefault(id);

    public string? ResolveMediaPath(string gameId, string relativePath)
    {
        var game = GetById(gameId);
        if (game == null) return null;

        // Prevent path traversal
        var fullPath = Path.GetFullPath(Path.Combine(game.FolderPath, relativePath));
        if (!fullPath.StartsWith(game.FolderPath, StringComparison.OrdinalIgnoreCase))
            return null;

        return File.Exists(fullPath) ? fullPath : null;
    }

    public string? ResolveCodesConfigPath(string gameId)
    {
        var game = GetById(gameId);
        if (game?.Codes?.Config == null) return null;
        return ResolveMediaPath(gameId, game.Codes.Config);
    }

    public string LibraryPath => _libraryPath;

    private static string? DetectFile(string dir, string baseName)
    {
        var extensions = new[] { ".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp" };
        foreach (var ext in extensions)
        {
            var candidate = baseName + ext;
            if (File.Exists(Path.Combine(dir, candidate)))
                return candidate;
        }
        return null;
    }
}
