using GFashion_BE.Models;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class ProductController : ControllerBase
{
    private readonly ProductService _productService;

    private const int DEFAULT_SALE_PRODUCT = 0;

    public ProductController(ProductService productService)
    {
        _productService = productService;
    }

    [HttpGet("Get-All")]
    public async Task<IActionResult> GetAll() => Ok(await _productService.GetAllAsync());

    [HttpGet("Get")]
    public async Task<IActionResult> GetById(string id)
    {
        var product = await _productService.GetByIdAsync(id);
        return product == null ? NotFound() : Ok(product);
    }

    [HttpPost("Create")]
    public async Task<IActionResult> Create(ProductDto request)
    {
        Product newProduct = new Product
        {
            Name = request.Name,
            Price = request.Price,
            Category = request.Category,
            Material = request.Material,
            Description = request.Description,
            Variants = request.Variants.Select(v => new ProductVariant
            {
                Color = v.Color,
                Sizes = v.Sizes,
                ImageUrl = v.ImageUrl,
                Stock = v.Stock
            }).ToList(),
            Sale = DEFAULT_SALE_PRODUCT,
            CreatedAt = DateTime.UtcNow
        };

        await _productService.CreateAsync(newProduct);
        return Ok("Product created.");
    }

    [HttpPut("Update")]
    public async Task<IActionResult> Update(string id, ProductDto productDto)
    {
        var existingProduct = await _productService.GetByIdAsync(id);
        if (existingProduct == null)
            throw new Exception("Product not found");

        var updatedProduct = new Product
        {
            Id = existingProduct.Id,
            Name = productDto.Name,
            Description = productDto.Description,
            Price = productDto.Price,
            Variants = productDto.Variants.Select(v => new ProductVariant
            {
                Color = v.Color,
                Sizes = v.Sizes,
                ImageUrl = v.ImageUrl,
                Stock = v.Stock
            }).ToList(),
            Category = productDto.Category,
            UpdatedAt = DateTime.UtcNow
        };

        await _productService.UpdateAsync(id, updatedProduct);
        return Ok("Product updated.");
    }

    [HttpDelete("Delete")]
    public async Task<IActionResult> Delete(string id)
    {
        await _productService.DeleteAsync(id);
        return Ok("Product deleted.");
    }
}
