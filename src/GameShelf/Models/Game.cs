using System.Text.Json.Serialization;

namespace GameShelf.Models;

public class Game
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = "";

    [JsonPropertyName("title")]
    public string Title { get; set; } = "";

    [JsonPropertyName("year")]
    public int? Year { get; set; }

    [JsonPropertyName("publisher")]
    public string? Publisher { get; set; }

    [JsonPropertyName("genre")]
    public string? Genre { get; set; }

    [JsonPropertyName("disks")]
    public List<Disk> Disks { get; set; } = new();

    [JsonPropertyName("manual")]
    public string? Manual { get; set; }

    [JsonPropertyName("codes")]
    public CodesReference? Codes { get; set; }

    [JsonPropertyName("requirements")]
    public GameRequirements? Requirements { get; set; }

    [JsonPropertyName("coverFront")]
    public string? CoverFront { get; set; }

    [JsonPropertyName("coverBack")]
    public string? CoverBack { get; set; }

    [JsonPropertyName("coverSpine")]
    public string? CoverSpine { get; set; }

    [JsonIgnore]
    public string FolderPath { get; set; } = "";
}

public class Disk
{
    [JsonPropertyName("label")]
    public string Label { get; set; } = "";

    [JsonPropertyName("file")]
    public string File { get; set; } = "";
}

public class CodesReference
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = "";

    [JsonPropertyName("config")]
    public string? Config { get; set; }
}

public class CodeWheelConfig
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = "";

    [JsonPropertyName("layers")]
    public List<WheelLayer>? Layers { get; set; }

    [JsonPropertyName("windowAngle")]
    public double? WindowAngle { get; set; }

    [JsonPropertyName("windowOffset")]
    public WheelOffset? WindowOffset { get; set; }

    [JsonPropertyName("file")]
    public string? File { get; set; }

    [JsonPropertyName("prompt")]
    public string? Prompt { get; set; }

    [JsonPropertyName("fields")]
    public List<string>? Fields { get; set; }

    [JsonPropertyName("entries")]
    public Dictionary<string, string>? Entries { get; set; }
}

public class WheelLayer
{
    [JsonPropertyName("image")]
    public string Image { get; set; } = "";

    [JsonPropertyName("rotatable")]
    public bool Rotatable { get; set; }
}

public class GameRequirements
{
    [JsonPropertyName("cpu")]
    public string? Cpu { get; set; }

    [JsonPropertyName("ram")]
    public string? Ram { get; set; }

    [JsonPropertyName("disk")]
    public string? Disk { get; set; }

    [JsonPropertyName("video")]
    public string? Video { get; set; }

    [JsonPropertyName("sound")]
    public string? Sound { get; set; }

    [JsonPropertyName("os")]
    public string? Os { get; set; }

    [JsonPropertyName("other")]
    public string? Other { get; set; }
}

public class WheelOffset
{
    [JsonPropertyName("x")]
    public double X { get; set; }

    [JsonPropertyName("y")]
    public double Y { get; set; }
}
