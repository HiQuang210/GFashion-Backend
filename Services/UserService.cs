using GFashion_BE.Models;
using MongoDB.Driver;

namespace GFashion_BE.Services;

public class UserService
{
    private readonly IMongoCollection<User> _users;

    public UserService(IConfiguration configuration)
    {
        var client = new MongoClient(configuration["MongoDB:ConnectionString"]);
        var database = client.GetDatabase(configuration["MongoDB:DatabaseName"]);
        _users = database.GetCollection<User>("Users");
    }

    // Get all users
    public async Task<List<User>> GetAllAsync()
    {
        return await _users.Find(_ => true).ToListAsync();
    }

    // Get one user by id
    public async Task<User?> GetByIdAsync(string id)
    {
        return await _users.Find(u => u.Id == id).FirstOrDefaultAsync();
    }

    // Get user by username
    public async Task<User?> GetByUsernameAsync(string email)
    {
        return await _users.Find(u => u.Email == email).FirstOrDefaultAsync();
    }

    // Create new user
    public async Task CreateAsync(User user)
    {
        await _users.InsertOneAsync(user);
    }

    // Update user
    public async Task UpdateAsync(string id, User userIn)
    {
        await _users.ReplaceOneAsync(u => u.Id == id, userIn);
    }

    // Delete user
    public async Task DeleteAsync(string id)
    {
        await _users.DeleteOneAsync(u => u.Id == id);
    }
}
