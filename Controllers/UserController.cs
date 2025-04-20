using GFashion_BE.Models;
using GFashion_BE.Services;
using Microsoft.AspNetCore.Mvc;

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

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] User user)
    {
        //var existing = await _userService.GetByUsernameAsync(user.Username);
        //if (existing != null)
        //{
        //    return BadRequest("Username already exists.");
        //}

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.PasswordHash);
        await _userService.CreateAsync(user);

        return Ok("User registered successfully.");
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] User loginRequest)
    {
        var user = await _userService.GetByUsernameAsync(loginRequest.Username);
        if (user == null || !BCrypt.Net.BCrypt.Verify(loginRequest.PasswordHash, user.PasswordHash))
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
