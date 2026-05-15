using System.Xml.Linq;

namespace ConditionalProperties.uSync.Extensions
{
    public static class XElementExtensions
    {
        public static TEnum GetEnumValue<TEnum>(this XElement x, string tag)
            where TEnum : struct
        {
            // Set default value
            TEnum parsedEnum = default;

            var element = x.Element(tag);
            if (element != null)
            {
                // Try to parse
                Enum.TryParse<TEnum>(element.Value, out parsedEnum);
            }

            return parsedEnum;
        }

    }
}
