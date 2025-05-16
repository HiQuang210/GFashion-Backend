using GFashion_BE.Services;
using Microsoft.AspNetCore.Mvc;
using GFashion_BE.Models;
using GFashion_BE.DTOs;
using GFashion_BE.Utilities;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authorization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace GFashion_BE.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly UserService _userService;
    private readonly IMemoryCache _memoryCache;
    private readonly IConfiguration _config;

    private const int CODE_EXPIRATION_MINUTES = 5;
    public UserController(UserService userService, IMemoryCache memoryCache, IConfiguration config)
    {
        _userService = userService;
        _memoryCache = memoryCache;
        _config = config;
    }

    [HttpPost("Register")]
    public async Task<IActionResult> Register([FromBody] AuthorizeDto registerDto)
    {
        if (!Utils.IsValidEmail(registerDto.Email)) 
            return BadRequest("Invalid email format.");

        if (registerDto.Password != registerDto.ConfirmPassword)
            return BadRequest("Passwords do not match.");

        var userExisted = await _userService.GetByUsernameAsync(registerDto.Email);
        if (userExisted != null) 
            return BadRequest("Username already exists.");

        registerDto.Password = BCrypt.Net.BCrypt.HashPassword(registerDto.Password);

        var newUser = new User
        {
            Email = registerDto.Email,
            Password = registerDto.Password,
            Role = UserRole.User,
            CreatedAt = DateTime.UtcNow,
            FirstName = registerDto.FirstName,
            LastName = registerDto.LastName,
            IsActive = true
        };

        await _userService.CreateAsync(newUser);

        return Ok("User registered successfully.");
    }

    [HttpPost("Register-Admin")]
    public async Task<IActionResult> RegisterAdmin([FromBody] AdminRegisterDto registerDto)
    {
        var secretKeyConfig = HttpContext.RequestServices.GetRequiredService<IConfiguration>()["AdminSecret"];

        if (registerDto.SecretKey != secretKeyConfig)
            return Unauthorized("Invalid secret key.");

        if (!Utils.IsValidEmail(registerDto.Email))
            return BadRequest("Invalid email format.");

        if (registerDto.Password != registerDto.ConfirmPassword)
            return BadRequest("Passwords do not match.");

        var userExisted = await _userService.GetByUsernameAsync(registerDto.Email);
        if (userExisted != null)
            return BadRequest("Username already exists.");

        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(registerDto.Password);

        var newAdmin = new User
        {
            Email = registerDto.Email,
            Password = hashedPassword,
            Role = UserRole.Admin,
            CreatedAt = DateTime.UtcNow,
            FirstName = registerDto.FirstName,
            LastName = registerDto.LastName,
            IsActive = true
        };

        await _userService.CreateAsync(newAdmin);

        return Ok("Admin registered successfully.");
    }

    [HttpPost("Login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginRequest)
    {
        var user = await _userService.GetByUsernameAsync(loginRequest.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(loginRequest.Password, user.Password))
            return Unauthorized("Invalid username or password.");

        var tokenHandler = new JwtSecurityTokenHandler();
        var jwtKey = _config["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key is not configured.");
        var key = Encoding.UTF8.GetBytes(jwtKey);
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Name, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString())
            }),
            Expires = DateTime.UtcNow.AddDays(7),
            Issuer = _config["Jwt:Issuer"],
            Audience = _config["Jwt:Audience"],
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        var tokenString = tokenHandler.WriteToken(token);

        return Ok(new { token = tokenString });
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

    [HttpPut("Update")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateUser([FromBody] UpdateUserDto dto)
    {
        var user = await _userService.GetByIdAsync(dto.UserId);
        if (user == null) return NotFound("User not found.");

        user.FirstName = dto.FirstName;
        user.LastName = dto.LastName;
        user.IsActive = dto.IsActive;

        await _userService.UpdateAsync(user.Id!, user);
        return Ok("User updated.");
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await _userService.GetAllAsync();
        return Ok(users);
    }
}
