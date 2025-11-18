using Xunit;
using HL7Helper;
using NHapi.Base.Model;
using System.Text;

namespace HL7Helper.Tests
{
    public class Hl7ParsingServiceTests
    {
        [Fact]
        public void ParseMessage_ValidHl7_ReturnsIMessage()
        {
            // Arrange
            var service = new Hl7ParsingService();
            string hl7Message = @"MSH|^~\&|SENDING_APP|SENDING_FAC|RECEIVING_APP|RECEIVING_FAC|20230101000000||ADT^A01|MSG00001|P|2.5
PID|1||123456^^^MRN||DOE^JOHN^^^^||19800101|M|||123 MAIN ST^^CITY^ST^12345||(555)555-5555|||||";
            byte[] messageBytes = Encoding.UTF8.GetBytes(hl7Message);

            // Act
            IMessage? result = service.ParseMessage(messageBytes);

            // Assert
            Assert.NotNull(result);
            Assert.IsAssignableFrom<IMessage>(result);
        }
    }
}