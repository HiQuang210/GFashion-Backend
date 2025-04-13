using Microsoft.AspNetCore.Mvc;
using GFashion_BE.DTOs;
using GFashion_BE.Services;

namespace GFashion_BE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserService _userService;

        public AuthController(UserService userService)
        {
            _userService = userService;
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterDto dto)
        {
            if (_userService.EmailExists(dto.Email))
            {
                return BadRequest(new { message = "Email đã tồn tại." });
            }

            var user = _userService.Create(dto.Email, dto.Password);
            return Ok(new { message = "Đăng ký thành công", user = new { user.Id, user.Email } });
        }
    }
}
