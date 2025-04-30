using GFashion_BE.Services;
using Microsoft.AspNetCore.Mvc;
using GFashion_BE.Models;
using GFashion_BE.DTOs;
using GFashion_BE.Utilities;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.Extensions.Caching.Memory;

namespace GFashion_BE.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly UserService _userService;
    private readonly IMemoryCache _memoryCache;

    private const int CODE_EXPIRATION_MINUTES = 5;

    public UserController(UserService userService, IMemoryCache memoryCache)
    {
        _userService = userService;
        _memoryCache = memoryCache;
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

    [HttpPost("Forgot-Password")]
    public async Task<IActionResult> ForgotPassword([FromBody] string email)
    {
        var user = await _userService.GetByUsernameAsync(email);
        if (user == null) return NotFound("Email not found.");

        var code = new Random().Next(100000, 999999).ToString();
        _memoryCache.Set(email, code, TimeSpan.FromMinutes(CODE_EXPIRATION_MINUTES));

        EmailService emailService = new EmailService();
        await emailService.SendVerificationCodeAsync(email, code);

        return Ok("A password reset code has been sent to your email.");
    }

    [HttpPost("Reset-Password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
    {
        var user = await _userService.GetByUsernameAsync(req.Email);
        if (user == null) return NotFound("User not found.");

        if (_memoryCache.TryGetValue(req.Email, out string? code))
        {
            if (code != req.ResetCode) return BadRequest("Invalid verification code.");
        }
        else
            return BadRequest("Verification code expired or not found " + code);

        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        user.Password = hashedPassword;

        await _userService.UpdateAsync(user.Id!, user);
        _memoryCache.Remove(req.Email);

        return Ok("Password reset successfully.");
    }

    [HttpPost("Change-Password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto req)
    {
        var user = await _userService.GetByUsernameAsync(req.Email);

        if (user == null)
            return BadRequest("User not found.");

        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        user.Password = hashedPassword;
        await _userService.UpdateAsync(user.Id!, user);

        return Ok("Password changed successfully.");
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await _userService.GetAllAsync();
        return Ok(users);
    }
}
