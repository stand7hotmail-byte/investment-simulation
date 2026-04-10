import React from 'react';

export const Footer = () => {
  return (
    <footer className="mt-auto py-6 border-t border-border text-muted-foreground text-xs leading-relaxed">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-muted/30 p-4 rounded-lg">
          <p className="font-semibold mb-2">免責事項（Disclaimer）</p>
          <p>
            本アプリによるシミュレーション結果は、過去の市場データに基づいた推計値であり、将来の投資収益や運用成果を保証するものではありません。
            表示される数値やグラフはあくまで参考情報であり、実際の運用結果とは異なる場合があります。
          </p>
          <p className="mt-2">
            投資に関する最終決定は、ご自身の判断と責任において行ってください。本サービスの使用により発生したいかなる損害（直接的・間接的を問わず）についても、
            当方は一切の責任を負いかねます。また、データの正確性や最新性についても保証するものではありません。
          </p>
        </div>
        <div className="mt-4 text-center">
          <p>&copy; {new Date().getFullYear()} InvestSim. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
