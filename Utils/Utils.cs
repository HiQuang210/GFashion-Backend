using System.Text.RegularExpressions;

namespace GFashion_BE.Utilities;

public static class Utils
{
    public static bool IsValidEmail(string email)
    {
        var regex = new Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$");
        return regex.IsMatch(email);
    }
}
