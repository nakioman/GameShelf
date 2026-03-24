using System.Text;
using System.Text.Json;

namespace GameShelf.Services;

public class EmulatorService
{
    private readonly HttpClient _http;
    private readonly string _baseUrl;
    private readonly ILogger<EmulatorService> _logger;

    // Track what's currently mounted per drive
    private readonly Dictionary<int, MountedDisk> _mounted = new();

    public EmulatorService(IConfiguration config, ILogger<EmulatorService> logger)
    {
        _baseUrl = config.GetValue<string>("Emulator:ApiUrl") ?? "http://localhost:8086";
        _http = new HttpClient { BaseAddress = new Uri(_baseUrl), Timeout = TimeSpan.FromSeconds(5) };
        _logger = logger;
    }

    public async Task<bool> MountDisk(int drive, string diskPath)
    {
        try
        {
            var fullPath = Path.GetFullPath(diskPath);
            var payload = JsonSerializer.Serialize(new { path = fullPath });
            var content = new StringContent(payload, Encoding.UTF8, "application/json");

            var response = await _http.PostAsync($"/api/fdd/{drive}", content);

            if (response.IsSuccessStatusCode)
            {
                _mounted[drive] = new MountedDisk(drive, fullPath, Path.GetFileName(diskPath));
                _logger.LogInformation("Mounted {Path} on drive {Drive}", fullPath, drive);
                return true;
            }

            _logger.LogWarning("86Box returned {Status} for mount on drive {Drive}", response.StatusCode, drive);
            return false;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Cannot reach 86Box API at {Url}", _baseUrl);
            return false;
        }
    }

    public async Task<bool> EjectDisk(int drive)
    {
        try
        {
            var response = await _http.DeleteAsync($"/api/fdd/{drive}");

            if (response.IsSuccessStatusCode)
            {
                _mounted.Remove(drive);
                _logger.LogInformation("Ejected drive {Drive}", drive);
                return true;
            }

            _logger.LogWarning("86Box returned {Status} for eject on drive {Drive}", response.StatusCode, drive);
            return false;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Cannot reach 86Box API at {Url}", _baseUrl);
            return false;
        }
    }

    public IReadOnlyDictionary<int, MountedDisk> GetMountedDisks() => _mounted;
}

public record MountedDisk(int Drive, string FullPath, string FileName);
