using GFashion_BE.Models;

namespace GFashion_BE.Services
{
    public class UserService
    {
        private static List<User> users = new(); 

        public User Create(string email, string password)
        {
            var user = new User
            {
                Id = users.Count + 1,
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password)
            };
            users.Add(user);
            return user;
        }

        public bool EmailExists(string email)
        {
            return users.Any(u => u.Email == email);
        }
    }
}
