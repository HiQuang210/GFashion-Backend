using GFashion_BE.Services;
using Microsoft.AspNetCore.Mvc;
using GFashion_BE.Models;
using GFashion_BE.DTOs;
using GFashion_BE.Utilities;

namespace GFashion_BE.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly UserService _userService;

    public UserController(UserService userService)
    {
        _userService = userService;
    }

    [HttpPost("Register")]
    public async Task<IActionResult> Register([FromBody] AuthorizeDto registerDto)
    {
        if (!Utils.IsValidEmail(registerDto.Email)) return BadRequest("Invalid email format.");

        var userExisted = await _userService.GetByUsernameAsync(registerDto.Email);

        if (userExisted != null) return BadRequest("Username already exists.");
        

        registerDto.Password = BCrypt.Net.BCrypt.HashPassword(registerDto.Password);

        var newUser = new User
        {
            Email = registerDto.Email,
            Password = registerDto.Password,
            Role = UserRole.User,
            CreatedAt = DateTime.UtcNow
        };

        await _userService.CreateAsync(newUser);

        return Ok("User registered successfully.");
    }

    [HttpPost("Login")]
    public async Task<IActionResult> Login([FromBody] AuthorizeDto loginRequest)
    {
        var user = await _userService.GetByUsernameAsync(loginRequest.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(loginRequest.Password, user.Password))
        {
            return Unauthorized("Invalid username or password.");
        }

        return Ok("Login successful.");
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await _userService.GetAllAsync();
        return Ok(users);
    }
}
