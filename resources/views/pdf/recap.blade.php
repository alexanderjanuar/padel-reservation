<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Rekapan Pendapatan {{ $titlePeriod }}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            margin: 20px;
            color: #1e293b;
        }

        .header-title {
            background-color: #f1f5f9;
            color: #0f172a;
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            padding: 10px;
            border: 1px solid #cbd5e1;
            margin-bottom: 20px;
            text-transform: uppercase;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin-bottom: 20px;
        }

        th,
        td {
            border: 1px solid #cbd5e1;
            padding: 8px 10px;
        }

        th {
            background-color: #f8fafc;
            color: #475569;
            text-align: center;
            font-weight: bold;
            text-transform: uppercase;
        }

        td {
            text-align: right;
            color: #334155;
        }

        td.center {
            text-align: center;
        }

        .font-bold {
            font-weight: bold;
            color: #0f172a;
        }

        .row-total td {
            background-color: #f8fafc;
            font-weight: bold;
            color: #0f172a;
        }

        .text-left {
            text-align: left;
        }
    </style>
</head>

<body>

    <div class="header-title">
        REKAPAN PENDAPATAN SOFIAH SPORT CENTRE {{ $titlePeriod }}
    </div>

    <table>
        <thead>
            <tr>
                <th width="5%">NO</th>
                <th width="15%">TANGGAL</th>
                @foreach ($sports as $sport)
                    <th>{{ strtoupper($sport->name) }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @php $i = 1; @endphp
            @foreach ($reportData as $date => $amounts)
                <tr>
                    <td class="center">{{ $i++ }}</td>
                    <td class="center font-bold">{{ $date }}</td>
                    @foreach ($sports as $sport)
                        <td>{{ $amounts[$sport->name] > 0 ? number_format($amounts[$sport->name], 0, ',', '.') : '-' }}</td>
                    @endforeach
                </tr>
            @endforeach
            <tr class="row-total">
                <td colspan="2" class="center uppercase">TOTAL PER SPORT</td>
                @foreach ($sports as $sport)
                    <td>{{ $sportTotals[$sport->name] > 0 ? number_format($sportTotals[$sport->name], 0, ',', '.') : '-' }}
                    </td>
                @endforeach
            </tr>
            <tr class="font-bold">
                <td colspan="{{ 2 + $sports->count() - 1 }}" class="text-left">TOTAL PENDAPATAN KOTOR (SELURUH LAPANGAN)</td>
                <td>Rp {{ number_format($grandTotal, 0, ',', '.') }}</td>
            </tr>
            <tr class="font-bold">
                <td colspan="{{ 2 + $sports->count() - 1 }}" class="text-left">PPN DAERAH (10%)</td>
                <td>Rp {{ number_format($ppn, 0, ',', '.') }}</td>
            </tr>
            <tr class="font-bold row-total">
                <td colspan="{{ 2 + $sports->count() - 1 }}" class="text-left uppercase">TOTAL PENDAPATAN BERSIH</td>
                <td style="color:#06D001;">Rp {{ number_format($totalWithPpn, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

</body>

</html>