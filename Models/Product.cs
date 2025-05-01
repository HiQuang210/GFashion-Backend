using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;
namespace GFashion_BE.Models
{
    public class Product
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("name")]
        public string Name { get; set; } = null!;

        [BsonElement("description")]
        public string? Description { get; set; } = string.Empty;

        [BsonElement("price")]
        public decimal Price { get; set; }

        [BsonElement("category")]
        public string Category { get; set; } = string.Empty;

        [BsonElement("material")]
        public string Material { get; set; } = string.Empty;

        public List<ProductVariant> Variants { get; set; } = new();

        [BsonElement("sale")]
        public int Sale { get; set; } = 0;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

}

public class ProductVariant
{
    public string Color { get; set; } = null!;
    public List<string> Sizes { get; set; } = new();
    public int Stock { get; set; }
    public string? ImageUrl { get; set; }
}
