import { Star, Shield, Clock, TrendingDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const COMPARISON_DATA = [
  {
    provider: "Practo",
    doctor: "Dr. Sameer Kulkarni",
    specialist: "Cardiologist",
    price: 800,
    rating: 4.8,
    reviews: 245,
    available: "Today, 4:30 PM",
    verified: true,
  },
  {
    provider: "Apollo 24x7",
    doctor: "Dr. Ananya Sharma",
    specialist: "Cardiologist",
    price: 1200,
    rating: 4.9,
    reviews: 512,
    available: "Tomorrow, 10:00 AM",
    verified: true,
  },
  {
    provider: "Healthians",
    doctor: "Dr. Rajat Verma",
    specialist: "Cardiologist",
    price: 650,
    rating: 4.6,
    reviews: 189,
    available: "Today, 6:00 PM",
    verified: false,
  },
]

export function ComparisonView() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-bold text-foreground">Doctor Availability & Price Comparison</h3>
        <Badge variant="outline" className="text-accent border-accent/20 bg-accent/5">
          <TrendingDown className="h-3 w-3 mr-1" /> Best Price: ₹650
        </Badge>
      </div>

      <div className="grid gap-4">
        {COMPARISON_DATA.map((item, i) => (
          <Card
            key={i}
            className="border-border hover:border-primary/30 transition-colors shadow-sm overflow-hidden group"
          >
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className="p-6 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-bold">
                      {item.provider}
                    </Badge>
                    {item.verified && <Shield className="h-4 w-4 text-accent" />}
                  </div>
                  <h4 className="text-lg font-bold text-foreground mb-1">{item.doctor}</h4>
                  <p className="text-sm text-muted-foreground mb-4">{item.specialist}</p>

                  <div className="flex flex-wrap gap-4 text-sm font-medium">
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span>{item.rating}</span>
                      <span className="text-muted-foreground font-normal">({item.reviews})</span>
                    </div>
                    <div className="flex items-center gap-1 text-foreground/70">
                      <Clock className="h-4 w-4" />
                      <span>{item.available}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-muted/20 md:w-48 flex flex-col justify-center items-center border-t md:border-t-0 md:border-l border-border">
                  <div className="text-center mb-4">
                    <span className="text-2xl font-bold text-foreground">₹{item.price}</span>
                    <p className="text-xs text-muted-foreground">Consultation Fee</p>
                  </div>
                  <Button className="w-full rounded-xl font-bold bg-primary hover:bg-primary/90 transition-transform group-hover:scale-105">
                    Book Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
