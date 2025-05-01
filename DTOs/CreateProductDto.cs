public class ProductDto
{
    public string Name { get; set; } = null!;
    public string Category { get; set; } = null!;
    public string Material { get; set; } = null!;
    public decimal Price { get; set; }
    public string Description { get; set; } = null!;
    public List<ProductVariantDto> Variants { get; set; } = new();
}

public class ProductVariantDto
{
    public string Color { get; set; } = null!;
    public List<string> Sizes { get; set; } = new();
    public string ImageUrl { get; set; } = null!;
    public int Stock { get; set; }
}
