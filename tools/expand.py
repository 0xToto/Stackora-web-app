import json, sys
R="23456789TJQKA"
def expand(spec):
    out=[]
    for tok in [t.strip() for t in spec.split(",") if t.strip()]:
        if "-" in tok:
            a,b=tok.split("-")
            if a[0]==a[1]:
                lo,hi=sorted([R.index(a[0]),R.index(b[0])]); out+= [R[i]*2 for i in range(lo,hi+1)]
            else:
                lo,hi=sorted([R.index(a[1]),R.index(b[1])]); out+=[a[0]+R[i]+a[2] for i in range(lo,hi+1)]
        elif tok.endswith("+"):
            t=tok[:-1]
            if t[0]==t[1]: out+=[R[i]*2 for i in range(R.index(t[0]),13)]
            else: out+=[t[0]+R[i]+t[2] for i in range(R.index(t[1]),R.index(t[0]))]
        else: out.append(tok)
    seen=[]; [seen.append(x) for x in out if x not in seen]
    return ",".join(seen)
spots=json.load(open(sys.argv[1]))
for s in spots: s["oop"]=expand(s["oop"]); s["ip"]=expand(s["ip"])
json.dump(spots,open(sys.argv[2],"w"),indent=1)
