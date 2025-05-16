namespace GFashion_BE.DTOs
{
    public class AdminRegisterDto : AuthorizeDto
    {
        public string SecretKey { get; set; } = null!;
    }
}