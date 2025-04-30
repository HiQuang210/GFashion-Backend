using MailKit.Net.Smtp;
using MimeKit;

public class EmailService
{
    private readonly string _smtpServer = "smtp.gmail.com";
    private readonly int _smtpPort = 587;
    private readonly string _senderEmail = "21521942@gm.uit.edu.vn";
    private readonly string _senderPassword = "hpcf hztb ynlo akaa";

    public async Task SendVerificationCodeAsync(string toEmail, string code)
    {
        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(_senderEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = "Your Verification Code";

        message.Body = new TextPart("plain")
        {
            Text = $"Your verification code is: {code}. This code will expire in 5 minutes!"
        };

        using var smtp = new SmtpClient();
        await smtp.ConnectAsync(_smtpServer, _smtpPort, MailKit.Security.SecureSocketOptions.StartTls);
        await smtp.AuthenticateAsync(_senderEmail, _senderPassword);
        await smtp.SendAsync(message);
        await smtp.DisconnectAsync(true);
    }
}
