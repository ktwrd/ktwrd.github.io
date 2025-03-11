Just some type conversions between languages and SQL dialects. Copied from multiple sources to make an AIO cheat sheet.

# C++ to Rust
| C++                      | Rust           | Note |
| ------------------------ | -------------- | ---- |
| char                     | `u8/i8`        | `char`s in C++ can be signed or unsigned. This assumption here is signed but it depends on the target system. `char` in Rust is not the same is C/C++ char since it supports all Unicode characters. |
| `unsigned char`          | `u8`           | |
| `short`                  | `i16`          | |
| `unsigned short`         | `u16`          | |
| `int`                    | `i32`          | Assumed signed (C/C++) |
| `unsigned int`           | `u32`          | Assumed signed (C/C++) |
| `long`                   | `i64`          | Assumed signed (C/C++) |
| `unsigned long`          | `u32` or `u64` | Assumed signed (C/C++) |
| `long long int`          | `i64`          | |
| `unsigned long long int` | `u64`          | |
| `size_t`                 | `usize`        | |
| `float`                  | `float32`      | |
| `double`                 | `f64`          | |
| `long double`            | ~~`f128`~~     | `f128` support exists in Rust but was removed due to issues for some platforms supporting/implementing it. |
| `bool`                   | `bool`         | |
| `void`                   | `()`           | |
| `char32_t`               | `char`         | |
| `wchar_t`                | `u8`           | |

## stdint/cstdint types
| C++                      | Rust           | C#       |
| ------------------------ | -------------- | -------- |
| `int8_t`                 | `i8`           | `sbyte`  |
| `uint8_t`                | `u8`           | `byte`   |
| `int16_t`                | `i16`          | `short`  |
| `uint16_t`               | `u16`          | `ushort` |
| `int32_t`                | `i32`          | `int`    |
| `uint32_t`               | `ui32`         | `uint`   |
| `int64_t`                | `i64`          | `long`   |
| `uint64_t`               | `u64`          | `ulong`  |

# C# to Rust
For more detail, see [this blog post](https://sebnilsson.com/blog/from-csharp-to-rust-code-basics/). (Which isn't by me)
| C#            | Rust           | Note |
| ------------- | -------------- | ---- |
| `sbyte`       | `u8`           | |
| `byte`        | `i8`           | |
| `short`       | `i16`          | |
| `char`        | `u16`          | Rust `char` != C# `char` |
| `ushort`      | `u16`          | |
| `int`         | `i32`          | |
| `uint`        | `u32`          | |
| `long`        | `i64`          | |
| `ulong`       | `u64`          | |
| N/A           | `i128`         | Does not exist natively in C# |
| N/A           | `u128`         | Does not exist natively in C# |
| `float`       | `f32`          | |
| `double`      | `f64`          | |
| `decimal`     | `f128`         | (Rust) Not supported on all platforms. |

# SQL Server to C#

| SQL Server         | C#                   | System.Data.SqlDbType |
| ------------------ | -------------------- | --------------------- |
| `date`             | `Date`               | `Date`                |
| `time`             | `TimeSpan`           | `Time`                |
| `datetime`         | `DateTime`           | `DateTime`            |
| `datetime2`        | `DateTime`           | `DateTime2`           |
| `datetimeoffset`   | `DateTimeOffset`     | `DateTimeOffset`      |
| `smalldatetime`    | `DateTime`           | `DateTime`            |
| **Text** | |
| `char`             | `string`, `char[]`   | `Char`                |
| `nchar`            | `string`, `char[]`   | `NChar`               |
| `varchar`          | `string`, `char[]`   | `VarChar`             |
| `nvarchar`         | `string`, `char[]`   | `NVarChar`            |
| `text`             | `string`, `char[]`   | `Text`                |
| `ntext`            | `string`, `char[]`   | `NText`               |
| **Numerical** | |
| `int`              | `Int32`, `int`       | `Int`                 |
| `tinyint`          | `byte`               | `TinyInt`             |
| `bigint`           | `Int64`, `long`      | `BigInt`              |
| `smallint`         | `Int16`, `short`     | `SmallInt`            |
| `smallmoney`       | `Decimal`, `decimal` | `SmallMoney`          |
| `decimal`          | `Decimal`, `decimal` | `Decimal`             |
| `real`             | `Single`, `float`    | `Real`                |
| `float`            | `Double`, `double`   | `Float`               |
| `numeric`          | `Decimal`, `decimal` | `Decimal`             |
| `money`            | `Decimal`, `decimal` | `Money`               |
| **Binary** | |
| `image`            | `byte[]`             | `Binary`              |
| `binary`           | `byte[]`             | `VarBinary`           |
| `varbinary`        | `byte[]`             | `VarBinary`           |
| `FILESTREAM`       | `byte[]`             | `VarBinary`           |
| `rowversion`       | `byte[]`             | `Timestamp`           |
| `timestamp`        | `byte[]`             | `Timestamp`           |
| **Misc** | |
| `bit`              | `bool`               | `Bit`                 |
| `uniqueidentifier` | `Guid`               | `UniqueIdentifier`    |
| `xml`              | `Xml`                | `Xml`                 |

# Oracle SQL to C#

| Oracle Data Type                 | C#         | Notes |
| -------------------------------- | ---------- | ----- |
| `BFILE`                          | `byte[]`   |
| `BLOB`                           | `byte[]`   |
| `CHAR`                           | `string`   |
| `CLOB`                           | `string`   |
| `DATE`                           | `DateTime` |
| `FLOAT`                          | `Decimal`  |
| `INTEGER`                        | `Decimal`  |
| `INTERVAL YEAR TO MONTH`         | `Int32`    |
| `INTERVAL DAY TO SECOND`         | `TimeSpan` |
| `LONG`                           | `string`   |
| `LONG RAW`                       | `byte[]`   |
| `NCHAR`                          | `string`   |
| `NCLOB`                          | `string`   |
| `NUMBER`                         | `Decimal`  |
| `NVARCHAR2`                      | `string`   |
| `RAW`                            | `byte[]`   |
| `ROWID`                          | `string`   |
| `TIMESTAMP`                      | `DateTime` |
| `TIMESTAMP WITH LOCAL TIME ZONE` | `DateTime` |
| `TIMESTAMP WITH TIME ZONE`       | `DateTime` |
| `UNSIGNED INTEGER`               | `Number`   | Alias to `NUMBER(38)`. When the data reader returns a `Decimal` or `OracleNumber` it can cause an overflow. |
| `VARCHAR2`                       | `String`   |

# References
- [https://locka99.gitbooks.io/a-guide-to-porting-c-to-rust/content/features_of_rust/types.html](https://locka99.gitbooks.io/a-guide-to-porting-c-to-rust/content/features_of_rust/types.html)
- [https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/integral-numeric-types](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/integral-numeric-types)
- [https://learn.microsoft.com/en-us/dotnet/framework/data/adonet/sql-server-data-type-mappings](https://learn.microsoft.com/en-us/dotnet/framework/data/adonet/sql-server-data-type-mappings)
- [https://learn.microsoft.com/en-us/dotnet/framework/data/adonet/oracle-data-type-mappings](https://learn.microsoft.com/en-us/dotnet/framework/data/adonet/oracle-data-type-mappings)
